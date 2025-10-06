import { Request, Response } from 'express';
import { extractPDFPages, groupPagesIntoBatches, getBatchText } from '../utils/pdfExtractor.js';
import { generateBatchQuestions, QuizQuestion } from '../services/geminiService.js';
import fs from 'fs/promises';

/**
 * Main controller for quiz generation
 * Implements the batch processing strategy you described!
 */
export async function generateQuizFromPDF(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const questionsPerPage = parseInt(req.body.questionsPerPage) || 2;
    const batchSize = parseInt(req.body.batchSize) || 3;

    console.log('📚 Starting quiz generation...');
    console.log(`⚙️ Settings: ${questionsPerPage} questions/page, batch size: ${batchSize}`);

    // Step 1: Extract text from PDF page by page
    const fileBuffer = await fs.readFile(req.file.path);
    const pages = await extractPDFPages(fileBuffer);
    
    console.log(`📖 Extracted ${pages.length} pages from PDF`);

    // Step 2: Group pages into batches
    const batches = groupPagesIntoBatches(pages, batchSize);
    console.log(`📦 Created ${batches.length} batches`);

    const allQuestions: QuizQuestion[] = [];
    let cumulativeSummary = '';

    // Step 3: Process each batch sequentially
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const pageNumbers = batch.map(p => p.pageNumber);
      const batchText = getBatchText(batch);

      console.log(`\n🔄 Processing batch ${i + 1}/${batches.length} (pages ${pageNumbers.join(', ')})`);

      try {
        // Generate questions for this batch
        // Using the summary from previous batch for context continuity
        const result = await generateBatchQuestions(
          batchText,
          pageNumbers,
          cumulativeSummary,
          questionsPerPage
        );

        allQuestions.push(...result.questions);
        cumulativeSummary = result.summary; // Save for next batch

        console.log(`✅ Batch ${i + 1} complete: ${result.questions.length} questions generated`);
        console.log(`📝 Summary for next batch: ${cumulativeSummary.substring(0, 100)}...`);

        // Progress update
        const progress = Math.round(((i + 1) / batches.length) * 100);
        console.log(`📊 Progress: ${progress}%`);

        // Small delay to avoid rate limits (adjust as needed)
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error(`❌ Error processing batch ${i + 1}:`, error);
        // Continue with next batch even if one fails
      }
    }

    // Clean up uploaded file
    await fs.unlink(req.file.path);

    // Step 4: Return all generated questions
    res.json({
      success: true,
      totalQuestions: allQuestions.length,
      totalPages: pages.length,
      batchesProcessed: batches.length,
      questions: allQuestions,
      breakdown: {
        mcq: allQuestions.filter(q => q.type === 'mcq').length,
        saq: allQuestions.filter(q => q.type === 'saq').length,
        laq: allQuestions.filter(q => q.type === 'laq').length,
      }
    });

  } catch (error) {
    console.error('Error in quiz generation:', error);
    
    // Clean up file if it exists
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch {}
    }

    res.status(500).json({
      error: 'Failed to generate quiz',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Get quiz generation progress (for real-time updates)
 * You can implement WebSocket or SSE for real-time progress
 */
export async function getQuizProgress(req: Request, res: Response) {
  // TODO: Implement progress tracking with WebSocket or Server-Sent Events
  res.json({ message: 'Progress tracking coming soon' });
}

