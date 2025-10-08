import { Pinecone } from '@pinecone-database/pinecone';

// Initialize Pinecone
const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || 'pcsk_5JjVx8_DoywLDiJbGSnb8Y91wTA1wnWY2VnpDpraJSJBiiNZkjXUGuox4kz7bNQtbMA8RG'
});

const INDEX_NAME = 'test-data';

// Page-based chunking function with smart merging
export function chunkTextByPages(pages: Array<{ pageNumber: number; text: string }>, minWords: number = 100): Array<{ text: string; pageNumbers: number[] }> {
  const chunks: Array<{ text: string; pageNumbers: number[] }> = [];
  let currentChunk = '';
  let currentPages: number[] = [];
  
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const wordCount = page.text.split(/\s+/).filter(Boolean).length;
    
    // Add current page to chunk
    currentChunk += (currentChunk ? '\n\n' : '') + `[Page ${page.pageNumber}]\n${page.text}`;
    currentPages.push(page.pageNumber);
    
    const totalWords = currentChunk.split(/\s+/).filter(Boolean).length;
    
    // Check if we should finalize this chunk
    const isLastPage = i === pages.length - 1;
    const nextPageWords = i < pages.length - 1 ? pages[i + 1].text.split(/\s+/).filter(Boolean).length : 0;
    const shouldMergeNext = totalWords < minWords && nextPageWords < minWords;
    
    if (isLastPage || (!shouldMergeNext && totalWords >= minWords)) {
      // Finalize current chunk
      chunks.push({
        text: currentChunk,
        pageNumbers: [...currentPages]
      });
      currentChunk = '';
      currentPages = [];
    }
  }
  
  // Add any remaining chunk
  if (currentChunk && currentPages.length > 0) {
    chunks.push({
      text: currentChunk,
      pageNumbers: currentPages
    });
  }
  
  return chunks;
}

// Original text chunking function (fallback for non-page-based content)
export function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    let end = start + chunkSize;
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf('.', end);
      const lastNewline = text.lastIndexOf('\n', end);
      const lastSpace = text.lastIndexOf(' ', end);
      const breakPoint = Math.max(lastPeriod, lastNewline, lastSpace);
      if (breakPoint > start + chunkSize * 0.5) {
        end = breakPoint + 1;
      }
    }
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 0) chunks.push(chunk);
    start = end - overlap;
  }
  return chunks;
}

// Generate simple text-based embeddings
export function generateEmbedding(text: string): number[] {
  const words = text.toLowerCase().split(/\s+/).filter(word => word.length > 2);
  const wordCounts: Record<string, number> = {};
  words.forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });
  
  const embedding = new Array(1024).fill(0);
  const uniqueWords = Object.keys(wordCounts);
  
  uniqueWords.forEach(word => {
    const hash = word.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const position = Math.abs(hash) % 1024;
    embedding[position] = wordCounts[word] / words.length;
  });
  
  return embedding;
}

// Upload chunks to Pinecone
export async function uploadToPinecone(
  chunks: string[],
  namespace: string,
  filename: string,
  fileId: string
): Promise<{ success: number; failed: number }> {
  const index = pc.index(INDEX_NAME);
  
  let success = 0;
  let failed = 0;

  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
    try {
      const chunk = chunks[chunkIndex];
      const embedding = generateEmbedding(chunk);
      
      await index.namespace(namespace).upsert([
        {
          id: `${fileId}-chunk-${chunkIndex}`,
          values: embedding,
          metadata: {
            text: chunk,
            filename: filename,
            chunkIndex: chunkIndex,
            totalChunks: chunks.length
          }
        }
      ]);
      success++;
    } catch (error) {
      console.error(`Error uploading chunk ${chunkIndex}:`, error);
      failed++;
    }
  }

  return { success, failed };
}

// Search in Pinecone
export async function searchInPinecone(
  query: string,
  namespace: string,
  topK: number = 5
): Promise<any[]> {
  const index = pc.index(INDEX_NAME);
  const queryEmbedding = generateEmbedding(query);
  
  const searchResponse = await index.namespace(namespace).query({
    vector: queryEmbedding,
    topK: topK,
    includeMetadata: true
  });

  return searchResponse.matches.map(match => ({
    text: match.metadata?.text || '',
    score: match.score,
    chunkIndex: match.metadata?.chunkIndex,
    totalChunks: match.metadata?.totalChunks,
    filename: match.metadata?.filename
  }));
}

// Get all namespaces
export async function getNamespaces(): Promise<Array<{ name: string; displayName: string; vectorCount?: number }>> {
  try {
    const index = pc.index(INDEX_NAME);
    const stats = await index.describeIndexStats();
    
    const namespaces: Array<{ name: string; displayName: string; vectorCount?: number }> = [];
    
    if (stats.namespaces) {
      Object.entries(stats.namespaces).forEach(([nsName, nsStats]) => {
        namespaces.push({
          name: nsName,
          displayName: nsName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Default',
          vectorCount: nsStats.recordCount
        });
      });
    }
    
    return namespaces;
  } catch (error) {
    console.error('Error getting namespaces:', error);
    return [];
  }
}

