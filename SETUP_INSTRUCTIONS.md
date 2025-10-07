# Setup Instructions for RAG Chat Feature

## Quick Start

### 1. Backend Setup

The backend dependencies have already been installed. Make sure your backend server is running:

```bash
cd backend
npm run dev
```

The server should start on `http://localhost:3000`

### 2. Frontend Setup

The frontend is already configured with routing. Make sure it's running:

```bash
cd frontend
npm run dev
```

The app should be available at `http://localhost:5174` (or 5173)

### 3. Environment Variables

Make sure you have a `.env` file in the `backend` directory with:

```env
PORT=3000
GEMINI_API_KEY=AIzaSyBJ28EGwNJKFNhGE8p4h-MhYFPmFXeKqNM
PINECONE_API_KEY=pcsk_5JjVx8_DoywLDiJbGSnb8Y91wTA1wnWY2VnpDpraJSJBiiNZkjXUGuox4kz7bNQtbMA8RG
```

## Application Structure

### Available Routes

1. **Home Page**: `http://localhost:5174/`
   - Landing page with features overview
   - Links to Quiz and Chat features

2. **Quiz Generator**: `http://localhost:5174/quiz`
   - Upload PDF and generate quizzes
   - MCQ, SAQ, and LAQ question types

3. **RAG Chat**: `http://localhost:5174/chat`
   - Upload PDFs and chat with them
   - AI-powered question answering

## Using the Chat Feature

### Step 1: Navigate to Chat
- Open your browser and go to `http://localhost:5174/chat`

### Step 2: Upload a PDF
- Click "Click to upload" in the left sidebar
- Select a PDF file (max 10MB)
- Click "Upload & Process"
- Wait for the success message (usually 5-30 seconds)

### Step 3: Ask Questions
- Your uploaded document will be automatically selected
- Type your question in the chat input at the bottom
- Press Enter or click the Send button
- View AI-generated answers with relevance scores

### Step 4: Multiple Documents
- Upload more PDFs as needed
- Use the "Select Document" dropdown to switch between them
- Click "↻ Refresh list" to update available documents

## Backend API Endpoints

### Chat Endpoints
- `POST /api/chat/upload` - Upload and process PDF
- `POST /api/chat/query` - Query a document
- `GET /api/chat/namespaces` - List available documents

### Quiz Endpoints (existing)
- `POST /api/quiz/generate` - Generate quiz from PDF

### Health Check
- `GET /api/health` - Check API status

## File Structure

### Backend Files Created/Modified
```
backend/
├── src/
│   ├── controllers/
│   │   └── chatController.ts       (NEW)
│   ├── routes/
│   │   └── chatRoutes.ts           (NEW)
│   ├── services/
│   │   └── pineconeService.ts      (NEW)
│   └── server.ts                   (MODIFIED)
└── package.json                    (MODIFIED)
```

### Frontend Files Created/Modified
```
frontend/
├── src/
│   ├── components/
│   │   ├── Chat.tsx                (NEW)
│   │   └── Home.tsx                (MODIFIED)
│   └── App.tsx                     (MODIFIED)
└── package.json                    (MODIFIED)
```

## Features Implemented

### Backend Features
✅ PDF upload and text extraction
✅ Intelligent text chunking with overlap
✅ Vector embedding generation
✅ Pinecone integration with unique namespaces
✅ Semantic search functionality
✅ Namespace management

### Frontend Features
✅ Modern chat interface
✅ PDF upload with progress indicators
✅ Document selection dropdown
✅ Real-time message updates
✅ Relevance scores display
✅ Error handling and validation
✅ Responsive design
✅ Navigation between features

## Technology Stack

### Backend
- **Express.js**: Web framework
- **TypeScript**: Type-safe development
- **Multer**: File upload handling
- **pdf-parse**: PDF text extraction
- **Pinecone**: Vector database for embeddings
- **CORS**: Cross-origin resource sharing

### Frontend
- **React**: UI framework
- **TypeScript**: Type-safe development
- **React Router**: Client-side routing
- **Tailwind CSS**: Styling
- **Lucide React**: Icons
- **Vite**: Build tool

## Troubleshooting

### Backend won't start
```bash
cd backend
npm install
npm run dev
```

### Frontend won't start
```bash
cd frontend
npm install
npm run dev
```

### Can't upload PDFs
- Check file size (max 10MB)
- Verify backend is running on port 3000
- Check browser console for CORS errors

### No search results
- Ensure PDF was uploaded successfully
- Verify namespace is selected
- Check Pinecone API key is valid
- Try more specific queries

### Port conflicts
- Frontend: Edit `vite.config.ts` to change port
- Backend: Edit `.env` PORT variable

## Next Steps

1. **Test the feature**: Upload a PDF and ask questions
2. **Customize**: Adjust chunking parameters, search results count
3. **Enhance**: Add better embeddings (OpenAI, Cohere)
4. **Scale**: Add user authentication, document management
5. **Deploy**: Set up production environment

## Documentation

See `CHAT_FEATURE.md` for detailed technical documentation including:
- Architecture details
- API specifications
- Data flow diagrams
- Performance considerations
- Security notes
- Future improvements

## Support

Both servers should show these logs when running correctly:

**Backend:**
```
🚀 Server running on http://localhost:3000
📝 API Health: http://localhost:3000/api/health
🎯 Quiz API: http://localhost:3000/api/quiz/generate
💬 Chat API: http://localhost:3000/api/chat
```

**Frontend:**
```
VITE v6.3.6  ready in 460 ms
➜  Local:   http://localhost:5174/
```

---

Happy coding! 🚀

