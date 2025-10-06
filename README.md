# BeyondChats - AI-Powered Learning Companion

Full-stack application for students to revise from their coursebooks using LLMs.

## Project Structure

```
Assignment/
├── frontend/          # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── SourceSelector.tsx
│   │   │   └── PDFViewer.tsx
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
│
└── backend/           # Express + TypeScript + Gemini API
    ├── src/
    │   ├── controllers/
    │   │   └── quizController.ts
    │   ├── services/
    │   │   └── geminiService.ts
    │   ├── utils/
    │   │   └── pdfExtractor.ts    # ⭐ Page-wise PDF extraction
    │   ├── routes/
    │   └── server.ts
    └── package.json
```

## Quick Start

### 1. Backend Setup

```bash
cd backend
npm install

# Create .env file with your Gemini API key
echo "GEMINI_API_KEY=your_key_here" > .env

# Start backend server
npm run dev
```

Backend runs on: `http://localhost:3000`

### 2. Frontend Setup

```bash
cd frontend
npm install

# Start frontend dev server
npm run dev
```

Frontend runs on: `http://localhost:5173`

## Features Implemented

### ✅ Phase 1: Source Selector & PDF Viewer
- PDF upload functionality
- Source selection (All PDFs / Specific PDF)
- PDF viewer with navigation and zoom
- Responsive design

### ✅ Phase 2: Quiz Generation (Backend)
- **Page-wise PDF text extraction** using pdfjs-dist
- **Batch processing** (2-3 pages at a time)
- **Context continuity** using summaries between batches
- **Gemini API integration** for question generation
- Generates MCQs, SAQs, and LAQs with explanations
- Tracks page numbers for citations

## How It Works

### PDF Processing Flow

```
User uploads 30-page PDF
        ↓
Backend extracts text PAGE BY PAGE (pdfjs-dist)
        ↓
Groups into batches of 3 pages
        ↓
For each batch:
  1. Send pages 1-3 to Gemini
  2. Generate questions + summary
  3. Use summary for next batch (pages 4-6)
  4. Repeat until all pages processed
        ↓
Return all questions to frontend
```

### Why This Approach?
- **Solves token limits**: Each batch is small enough for LLM context
- **Maintains continuity**: Summaries connect batches
- **Tracks citations**: Each question knows which pages it came from
- **Cost-effective**: Only processes what's needed

## API Documentation

### Generate Quiz
```bash
POST /api/quiz/generate
Content-Type: multipart/form-data

Body:
- pdf: (file) PDF file
- questionsPerPage: (number) default: 2
- batchSize: (number) default: 3

Response:
{
  "success": true,
  "totalQuestions": 60,
  "totalPages": 30,
  "questions": [...]
}
```

## Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- react-pdf (PDF viewing)
- lucide-react (icons)

### Backend
- Node.js + Express
- TypeScript
- pdfjs-dist (PDF text extraction)
- @google/generative-ai (Gemini API)
- multer (file uploads)

## Environment Variables

### Backend `.env`:
```env
GEMINI_API_KEY=your_gemini_api_key
PORT=3000
NODE_ENV=development
```

Get Gemini API key: https://makersuite.google.com/app/apikey (FREE!)

## Development

### Run both servers:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

## Testing

1. Open frontend: `http://localhost:5173`
2. Upload a PDF file
3. Backend will:
   - Extract text page by page
   - Process in batches
   - Generate quiz questions
   - Return to frontend
4. Frontend displays quiz questions

## Next Features (Future)

- [ ] Chat interface with RAG
- [ ] Vector database for semantic search
- [ ] Progress tracking dashboard
- [ ] Quiz taking interface
- [ ] Answer scoring
- [ ] YouTube video recommendations
- [ ] User authentication

## Performance

**For 30-page PDF:**
- Extraction: ~5-10 seconds
- Quiz generation: ~40-50 seconds
- Total: Under 1 minute!

**Cost (Gemini 1.5 Flash):**
- ~$0.01-0.02 per 30-page document
- Very affordable for demo/production!

## License
MIT

## Author
Built for BeyondChats Assignment - October 2025

