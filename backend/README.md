# BeyondChats Backend API

Express.js + TypeScript backend for quiz generation and PDF processing.

## How PDF Page-wise Extraction Works

### The Solution to Your Question! 📚

**Problem**: How to extract data from PDF page-wise when it has 30+ pages?

**Solution**: We use `pdfjs-dist` library which provides native page-by-page extraction:

```typescript
// 1. Load PDF document
const pdfDocument = await pdfjsLib.getDocument(buffer).promise;

// 2. Loop through each page
for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
  // 3. Get individual page
  const page = await pdfDocument.getPage(pageNum);
  
  // 4. Extract text from that specific page
  const textContent = await page.getTextContent();
  
  // 5. Store page number with its text
  pages.push({
    pageNumber: pageNum,
    text: extractedText,
    wordCount: wordCount
  });
}
```

This gives us **complete control** over which pages to process together!

## Architecture Flow

```
User uploads PDF (30 pages)
        ↓
extractPDFPages() → Returns array of 30 page objects
        ↓
groupPagesIntoBatches(3) → Creates 10 batches of 3 pages each
        ↓
For each batch:
  1. Get text from pages (e.g., pages 1-3)
  2. Send to Gemini API with previous summary
  3. Generate questions + new summary
  4. Save questions
  5. Use summary for next batch (continuity!)
        ↓
Return all questions to frontend
```

## API Endpoints

### 1. Generate Quiz from PDF

**POST** `/api/quiz/generate`

**Request:**
```bash
curl -X POST http://localhost:3000/api/quiz/generate \
  -F "pdf=@your-file.pdf" \
  -F "questionsPerPage=2" \
  -F "batchSize=3"
```

**Response:**
```json
{
  "success": true,
  "totalQuestions": 60,
  "totalPages": 30,
  "batchesProcessed": 10,
  "questions": [
    {
      "id": "q_1_1_1234567890",
      "type": "mcq",
      "question": "What is Newton's First Law?",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correctAnswer": "A) ...",
      "explanation": "...",
      "pageNumbers": [1, 2, 3],
      "difficulty": "easy",
      "topic": "Newton's Laws"
    }
  ],
  "breakdown": {
    "mcq": 36,
    "saq": 18,
    "laq": 6
  }
}
```

### 2. Health Check

**GET** `/api/health`

```json
{
  "status": "ok",
  "message": "BeyondChats API is running",
  "geminiConfigured": true
}
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Create `.env` file:
```env
GEMINI_API_KEY=your_actual_api_key_here
PORT=3000
NODE_ENV=development
```

Get your Gemini API key from: https://makersuite.google.com/app/apikey

### 3. Run Development Server

```bash
npm run dev
```

Server will start on `http://localhost:3000`

### 4. Build for Production

```bash
npm run build
npm start
```

## File Structure

```
backend/
├── src/
│   ├── controllers/
│   │   └── quizController.ts       # Main quiz generation logic
│   ├── services/
│   │   └── geminiService.ts        # Gemini API integration
│   ├── utils/
│   │   └── pdfExtractor.ts         # PDF page-wise extraction ⭐
│   ├── routes/
│   │   └── quizRoutes.ts           # API routes
│   └── server.ts                   # Express server setup
├── uploads/                        # Temporary PDF storage
├── package.json
├── tsconfig.json
└── .env
```

## Key Features

### ✅ Page-wise PDF Extraction
- Extracts text from each page individually
- Tracks page numbers with content
- Handles large PDFs (30+ pages)

### ✅ Batch Processing with Continuity
- Groups pages into batches (default: 3 pages)
- Generates summary after each batch
- Passes summary to next batch for context continuity
- Avoids losing context across batches!

### ✅ Smart Quiz Generation
- Uses Gemini 1.5 Flash (fast + cost-effective)
- Generates MCQs (60%), SAQs (30%), LAQs (10%)
- Varies difficulty levels
- Includes explanations
- Cites page numbers

### ✅ Rate Limit Handling
- 2-second delay between batches
- Prevents API rate limit errors
- Configurable delay

## How to Test

### Test with cURL:

```bash
# Upload a PDF and generate quiz
curl -X POST http://localhost:3000/api/quiz/generate \
  -F "pdf=@path/to/your/textbook.pdf" \
  -F "questionsPerPage=2" \
  -F "batchSize=3"
```

### Test with Postman:
1. POST to `http://localhost:3000/api/quiz/generate`
2. Body → form-data
3. Add key "pdf" (type: File), select your PDF
4. Add key "questionsPerPage" (type: Text), value: "2"
5. Add key "batchSize" (type: Text), value: "3"
6. Send

## Performance Notes

### For a 30-page PDF:
- Extraction: ~5-10 seconds (fast!)
- Batch processing (10 batches): ~30-40 seconds
  - 2 seconds per batch (API call)
  - 2 seconds delay between batches
- **Total time: ~40-50 seconds** for full quiz generation

### Cost Estimation (Gemini):
- Gemini 1.5 Flash is very cheap
- ~1500 tokens per batch (input)
- ~500 tokens per response (output)
- For 30 pages (10 batches): ~$0.01-0.02
- **Very affordable for a demo/assignment!**

## Troubleshooting

### "GEMINI_API_KEY not set"
- Make sure you have `.env` file in backend folder
- Add: `GEMINI_API_KEY=your_key_here`

### "Failed to extract PDF"
- Check if PDF is valid and not corrupted
- Some scanned PDFs might not have extractable text
- Try with a different PDF

### "Rate limit exceeded"
- Increase delay between batches in `quizController.ts`
- Change `setTimeout(resolve, 2000)` to higher value

## Next Steps

1. ✅ PDF extraction page-wise - **DONE**
2. ✅ Batch processing with summaries - **DONE**
3. ✅ Quiz generation with Gemini - **DONE**
4. 🔄 Add WebSocket for real-time progress
5. 🔄 Add RAG for chat-based Q&A
6. 🔄 Store questions in database
7. 🔄 Add caching to avoid regenerating

## License
MIT

