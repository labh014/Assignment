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

export interface ChatResponse {
  answer: string;
  sources: string[];
  confidence: 'high' | 'medium' | 'low';
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
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  
  const prompt = `You are an expert educator creating quiz questions from educational content.

${previousSummary ? `Previous context summary:\n${previousSummary}\n\n` : ''}

Current content from pages ${pageNumbers.join(', ')}:
${batchText}

INSTRUCTIONS - READ CAREFULLY:
1. **Analyze Content Depth**: Carefully assess how much substantial content is present
2. **Quality Over Quantity**: ONLY generate questions if there's enough meaningful content
3. **Adaptive Question Count**: 
   - Rich content (lots of concepts/details): Up to ${pageNumbers.length * 3} questions
   - Moderate content: 1-2 questions per page
   - Sparse content (definitions, examples only): 0-1 questions per page
   - Very sparse content (minimal text): Skip if necessary
4. **Smart Distribution**: Aim for ~60% MCQs, ~30% SAQs, ~10% LAQs (adjust if needed)
5. **Content-Based Only**: NEVER make up questions - only use what's actually in the text
6. **Avoid Redundancy**: Don't ask similar questions about the same concept

Quality Standards:
✓ Test actual understanding, not memorization
✓ Cover key concepts and important details
✓ Include varied difficulty levels (easy, medium, hard)
✓ MCQs must have 4 distinct, plausible options
✓ Each option should be reasonable (avoid obvious wrong answers)
✓ Provide educational explanations that add value
✓ Questions should be clear and unambiguous

If content is too sparse or repetitive, generate FEWER high-quality questions rather than forcing poor-quality ones.

Also provide:
1. A brief summary (80-120 words) of key concepts covered
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
    console.log(`🤖 Generating adaptive quiz questions for pages ${pageNumbers.join(', ')}...`);
    
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
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  
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

/**
 * Generate intelligent chat response using RAG results
 * Takes top 3-5 Pinecone results and user query to generate contextual answer
 */
export async function generateChatResponse(
  userQuery: string,
  ragResults: Array<{
    text: string;
    score: number;
    filename: string;
    chunkIndex: number;
  }>
): Promise<ChatResponse> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Use top 3-5 results based on relevance scores
    const topChunksCount = ragResults.length >= 5 ? 5 : Math.max(3, ragResults.length);
    const topResults = ragResults.slice(0, topChunksCount);

    // Prepare context from top results (without relevance scores)
    const contextText = topResults
      .map((result, index) => 
        `[Source ${index + 1}]\n${result.text}`
      )
      .join('\n\n---\n\n');

    const prompt = `
You are an intelligent AI assistant that helps users understand documents through RAG (Retrieval-Augmented Generation).

CONTEXT FROM DOCUMENT:
${contextText}

USER QUESTION:
${userQuery}

INSTRUCTIONS:
1. **Primary Goal**: Answer the user's question using the provided context
2. **If Direct Answer Found**: Provide a comprehensive response based on the context
3. **If Answer Not Directly Found**: 
   - Still provide a helpful response
   - Use related information from the context
   - Make intelligent connections to the user's question
   - Explain what information IS available that relates to their query
4. **If Context is Completely Unrelated**:
   - Acknowledge the limitation
   - Summarize what the document DOES contain
   - Suggest related questions that CAN be answered
5. **Always Be Helpful**: Never just say "I can't answer" - always try to provide value

RESPONSE GUIDELINES:
✓ Be conversational and friendly
✓ Provide detailed, well-structured answers
✓ Reference sources naturally (e.g., "According to Source 1...")
✓ Make connections between user's question and available content
✓ If making inferences, clearly indicate so
✓ Offer to clarify or answer related questions
✓ Maintain professional, educational tone
✓ Write naturally - DO NOT mention relevance scores, confidence levels, or technical retrieval metrics
✓ DO NOT say things like "based on the relevance" or "the confidence of this information"
✓ Present information as if you're explaining from the document directly

IMPORTANT: 
- Your goal is to be maximally helpful while being honest about the limitations of the provided context
- Never mention technical aspects like "relevance scores", "chunk quality", or "confidence levels"
- Just provide natural, helpful answers as if you've read the document

Please provide your response:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const answer = response.text();

    // Determine confidence based on relevance scores of top results
    const avgScore = topResults.reduce((sum, r) => sum + r.score, 0) / topResults.length;
    let confidence: 'high' | 'medium' | 'low' = 'low';
    if (avgScore > 0.7) confidence = 'high';
    else if (avgScore > 0.4) confidence = 'medium';

    // Extract sources (clean format without technical metrics)
    const sources = topResults.map((r, idx) => 
      `${r.filename}`
    );

    console.log(`✅ Generated response using ${topResults.length} chunks with ${avgScore.toFixed(2)} avg relevance`);

    return {
      answer: answer,
      sources: sources,
      confidence: confidence
    };

  } catch (error) {
    console.error('Error generating chat response:', error);
    throw new Error('Failed to generate chat response');
  }
}

