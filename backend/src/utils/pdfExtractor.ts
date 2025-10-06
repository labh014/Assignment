import * as pdfjsLib from 'pdfjs-dist';
import { TextItem } from 'pdfjs-dist/types/src/display/api';

// PDF.js requires a worker, but we'll use it in Node.js mode
const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.mjs');

interface PDFPage {
  pageNumber: number;
  text: string;
  wordCount: number;
}

/**
 * Extract text from PDF page by page
 * This is the key function that solves your concern!
 */
export async function extractPDFPages(buffer: Buffer): Promise<PDFPage[]> {
  try {
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
    });
    
    const pdfDocument = await loadingTask.promise;
    const numPages = pdfDocument.numPages;
    
    console.log(`📄 PDF loaded: ${numPages} pages`);
    
    const pages: PDFPage[] = [];
    
    // Extract text from each page individually
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Combine all text items into a single string
      const pageText = textContent.items
        .map((item) => {
          if ('str' in item) {
            return (item as TextItem).str;
          }
          return '';
        })
        .join(' ')
        .trim();
      
      const wordCount = pageText.split(/\s+/).filter(Boolean).length;
      
      pages.push({
        pageNumber: pageNum,
        text: pageText,
        wordCount,
      });
      
      console.log(`✅ Extracted page ${pageNum}: ${wordCount} words`);
    }
    
    return pages;
  } catch (error) {
    console.error('Error extracting PDF:', error);
    throw new Error('Failed to extract PDF content');
  }
}

/**
 * Group pages into batches for processing
 */
export function groupPagesIntoBatches(
  pages: PDFPage[],
  batchSize: number = 3
): PDFPage[][] {
  const batches: PDFPage[][] = [];
  
  for (let i = 0; i < pages.length; i += batchSize) {
    batches.push(pages.slice(i, i + batchSize));
  }
  
  return batches;
}

/**
 * Get summary text from a batch of pages
 */
export function getBatchText(batch: PDFPage[]): string {
  return batch
    .map((page) => `[Page ${page.pageNumber}]\n${page.text}`)
    .join('\n\n---\n\n');
}

