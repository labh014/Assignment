import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyBJ28EGwNJKFNhGE8p4h-MhYFPmFXeKqNM");

export interface QuizQuestion {
  id: string;
  type: 'mcq' | 'saq' | 'laq';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  pageNumbers: number[];
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
}

export interface BatchQuizResult {
  questions: QuizQuestion[];
  summary: string;
  topics: string[];
}

/**
 * Generate quiz questions from a batch of pages
 * Uses the summary from previous batch for continuity
 */
export async function generateBatchQuestions(
  batchText: string,
  pageNumbers: number[],
  previousSummary: string = '',
  questionsPerPage: number = 2
): Promise<BatchQuizResult> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  
  const totalQuestions = Math.ceil(pageNumbers.length * questionsPerPage);
  const mcqCount = Math.ceil(totalQuestions * 0.6); // 60% MCQs
  const saqCount = Math.ceil(totalQuestions * 0.3); // 30% SAQs
  const laqCount = Math.max(1, totalQuestions - mcqCount - saqCount); // Rest LAQs
  
  const prompt = `You are an expert educator creating quiz questions from educational content.

${previousSummary ? `Previous context summary:\n${previousSummary}\n\n` : ''}

Current content from pages ${pageNumbers.join(', ')}:
${batchText}

Generate ${totalQuestions} high-quality quiz questions:
- ${mcqCount} Multiple Choice Questions (MCQs)
- ${saqCount} Short Answer Questions (SAQs) 
- ${laqCount} Long Answer Questions (LAQs)

Requirements:
1. Cover key concepts from this section
2. Consider the previous context for continuity (if provided)
3. Vary difficulty levels (easy, medium, hard)
4. MCQs should have 4 options (A, B, C, D)
5. Each question should test understanding, not just memorization
6. Provide clear explanations for correct answers

Also provide:
1. A brief summary (80-120 words) of key concepts covered in these pages
2. List of main topics/themes (3-5 topics)

**IMPORTANT**: Respond ONLY with valid JSON. No markdown, no code blocks, just raw JSON.

{
  "questions": [
    {
      "type": "mcq",
      "question": "Question text here?",
      "options": ["A) First option", "B) Second option", "C) Third option", "D) Fourth option"],
      "correctAnswer": "B) Second option",
      "explanation": "Detailed explanation why this is correct",
      "pageNumbers": [${pageNumbers.join(', ')}],
      "difficulty": "medium",
      "topic": "Main topic name"
    }
  ],
  "summary": "Brief summary of key concepts covered in these pages for context continuity",
  "topics": ["Topic 1", "Topic 2", "Topic 3"]
}`;

  try {
    console.log(`🤖 Generating ${totalQuestions} questions for pages ${pageNumbers.join(', ')}...`);
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Clean up the response - remove markdown code blocks if present
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\n/, '').replace(/\n```$/, '');
    }
    
    const parsed: BatchQuizResult = JSON.parse(cleanedText);
    
    // Add unique IDs to questions
    parsed.questions = parsed.questions.map((q, idx) => ({
      ...q,
      id: `q_${pageNumbers[0]}_${idx + 1}_${Date.now()}`,
    }));
    
    console.log(`✅ Generated ${parsed.questions.length} questions`);
    
    return parsed;
  } catch (error) {
    console.error('Error generating questions:', error);
    throw new Error('Failed to generate quiz questions');
  }
}

/**
 * Generate questions for chat/RAG mode (on-demand)
 */
export async function generateTargetedQuestions(
  context: string,
  topic: string,
  count: number = 5
): Promise<QuizQuestion[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
  
  const prompt = `Generate ${count} quiz questions about "${topic}" based on this context:

${context}

Mix question types (MCQs, SAQs, LAQs) and difficulty levels.

**IMPORTANT**: Respond ONLY with valid JSON array. No markdown, no code blocks.

[
  {
    "type": "mcq",
    "question": "Question text?",
    "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
    "correctAnswer": "A) Option 1",
    "explanation": "Why this is correct",
    "pageNumbers": [],
    "difficulty": "medium",
    "topic": "${topic}"
  }
]`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    
    // Clean up response
    let cleanedText = text;
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\n/, '').replace(/\n```$/, '');
    }
    
    const questions: QuizQuestion[] = JSON.parse(cleanedText);
    
    // Add unique IDs
    return questions.map((q, idx) => ({
      ...q,
      id: `q_targeted_${idx + 1}_${Date.now()}`,
    }));
  } catch (error) {
    console.error('Error generating targeted questions:', error);
    throw new Error('Failed to generate targeted questions');
  }
}

