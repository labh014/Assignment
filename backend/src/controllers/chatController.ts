import { Request, Response } from 'express';
import fs from 'fs';
import { extractPDFPages } from '../utils/pdfExtractor.js';
import { chunkText, uploadToPinecone, searchInPinecone, getNamespaces } from '../services/pineconeService.js';
import { generateChatResponse } from '../services/geminiService.js';

// Upload PDF and process for RAG
export async function uploadPDF(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    console.log('Processing PDF:', req.file.filename);

    // Read and parse PDF
    const pdfBuffer = fs.readFileSync(req.file.path);
    const pages = await extractPDFPages(pdfBuffer);
    
    // Combine all pages into single text
    const extractedText = pages.map(page => page.text).join('\n\n');

    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No text could be extracted from the PDF' 
      });
    }

    console.log('Text extracted, length:', extractedText.length);

    // Chunk the text
    const chunks = chunkText(extractedText);
    console.log('Text chunked into', chunks.length, 'chunks');

    // Create unique namespace for this PDF
    const timestamp = Date.now();
    const namespace = req.file.originalname
      .replace(/\.pdf$/i, '')
      .replace(/[^a-zA-Z0-9-]/g, '_') + `_${timestamp}`;
    
    console.log('Using namespace:', namespace);

    // Upload to Pinecone
    const result = await uploadToPinecone(
      chunks,
      namespace,
      req.file.originalname,
      req.file.filename
    );

    // Keep the uploaded file for viewing (don't delete immediately)
    // fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      chunks: result.success,
      failed: result.failed,
      totalChunks: chunks.length,
      namespace: namespace,
      filename: req.file.originalname,
      fileId: req.file.filename, // This is the actual stored filename
      message: `Successfully uploaded ${result.success} out of ${chunks.length} chunks`
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process PDF. Please try again.',
      details: error.message 
    });
  }
}

// Search/Query the uploaded PDFs
export async function queryChatbot(req: Request, res: Response) {
  try {
    const { query, namespace } = req.body;

    if (!query) {
      return res.status(400).json({ 
        success: false, 
        error: 'Query is required' 
      });
    }

    if (!namespace) {
      return res.status(400).json({ 
        success: false, 
        error: 'Namespace is required. Please select a PDF.' 
      });
    }

    console.log('Searching for:', query, 'in namespace:', namespace);

    // Search in Pinecone (get top 5 for context, but we'll use top 2 for Gemini)
    const results = await searchInPinecone(query, namespace, 5);

    // Generate intelligent response using Gemini with top 2 results
    const geminiResponse = await generateChatResponse(query, results);

    res.json({
      success: true,
      query: query,
      namespace: namespace,
      results: results,
      answer: geminiResponse.answer,
      confidence: geminiResponse.confidence,
      sources: geminiResponse.sources,
      rawResults: results // Keep raw results for debugging
    });

  } catch (error: any) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed. Please try again.',
      details: error.message
    });
  }
}

// Get list of available namespaces (uploaded PDFs)
export async function listNamespaces(req: Request, res: Response) {
  try {
    console.log('Fetching namespaces from Pinecone...');
    const namespaces = await getNamespaces();
    
    console.log('Found namespaces:', namespaces.length);
    res.json({
      success: true,
      namespaces: namespaces
    });

  } catch (error: any) {
    console.error('Error getting namespaces:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch namespaces',
      details: error.message,
      namespaces: []
    });
  }
}

