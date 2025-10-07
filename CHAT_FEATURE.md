# RAG Chat Feature Documentation

## Overview

The RAG (Retrieval-Augmented Generation) Chat feature allows users to upload PDF documents and interact with them through a conversational interface. The system uses vector embeddings and Pinecone for efficient document retrieval.

## Features

- **PDF Upload**: Upload any PDF document for processing
- **Intelligent Chunking**: Automatically splits documents into meaningful chunks
- **Vector Storage**: Stores document embeddings in Pinecone with unique namespaces
- **Semantic Search**: Finds relevant content based on natural language queries
- **Chat Interface**: Clean, intuitive chat UI for asking questions
- **Context-Aware Responses**: Returns relevant sections with relevance scores

## Architecture

### Backend Components

#### 1. **Pinecone Service** (`backend/src/services/pineconeService.ts`)
- `chunkText()`: Splits text into overlapping chunks for better context
- `generateEmbedding()`: Creates 1024-dimensional embeddings using text hashing
- `uploadToPinecone()`: Uploads document chunks to Pinecone
- `searchInPinecone()`: Performs semantic search across stored documents
- `getNamespaces()`: Lists all available document namespaces

#### 2. **Chat Controller** (`backend/src/controllers/chatController.ts`)
- `uploadPDF()`: Handles PDF upload, extraction, chunking, and storage
- `queryChatbot()`: Processes user queries and returns relevant content
- `listNamespaces()`: Returns available documents for selection

#### 3. **Chat Routes** (`backend/src/routes/chatRoutes.ts`)
- `POST /api/chat/upload`: Upload and process PDFs
- `POST /api/chat/query`: Query documents
- `GET /api/chat/namespaces`: List available documents

### Frontend Component

#### **Chat Component** (`frontend/src/components/Chat.tsx`)
- Split-panel design: sidebar for uploads, main area for chat
- Real-time message history
- Document selection dropdown
- Upload progress indicators
- Relevance scores for search results

## API Endpoints

### 1. Upload PDF
```
POST /api/chat/upload
Content-Type: multipart/form-data

Body:
- pdf: PDF file

Response:
{
  "success": true,
  "chunks": 25,
  "failed": 0,
  "totalChunks": 25,
  "namespace": "document_name_1234567890",
  "filename": "document.pdf",
  "message": "Successfully uploaded 25 out of 25 chunks"
}
```

### 2. Query Document
```
POST /api/chat/query
Content-Type: application/json

Body:
{
  "query": "What is the main topic?",
  "namespace": "document_name_1234567890"
}

Response:
{
  "success": true,
  "query": "What is the main topic?",
  "namespace": "document_name_1234567890",
  "results": [
    {
      "text": "Relevant text chunk...",
      "score": 0.85,
      "chunkIndex": 5,
      "totalChunks": 25,
      "filename": "document.pdf"
    }
  ],
  "context": "Combined relevant text...",
  "answer": "Based on the document, here are the relevant sections:..."
}
```

### 3. List Namespaces
```
GET /api/chat/namespaces

Response:
{
  "success": true,
  "namespaces": [
    {
      "name": "document_1_1234567890",
      "displayName": "Document 1 1234567890",
      "vectorCount": 25
    }
  ]
}
```

## Data Flow

1. **Upload Phase**:
   - User selects PDF file
   - Frontend sends file to `/api/chat/upload`
   - Backend extracts text using `pdf-parse`
   - Text is chunked with overlap for context preservation
   - Each chunk is converted to 1024-dim embedding
   - Embeddings stored in Pinecone with unique namespace
   - Frontend updates namespace list

2. **Query Phase**:
   - User selects document from dropdown
   - User types question
   - Frontend sends query to `/api/chat/query`
   - Backend generates query embedding
   - Pinecone performs vector similarity search
   - Top 5 relevant chunks returned with scores
   - Frontend displays results in chat format

## Namespace Strategy

Each uploaded PDF gets a unique namespace in the format:
```
{sanitized_filename}_{timestamp}
```

Example: `my_document_pdf_1696123456789`

Benefits:
- Isolates documents from each other
- Prevents cross-contamination in search results
- Allows multiple versions of the same document
- Easy to identify and manage documents

## Embedding Strategy

Currently uses a simple text-based embedding approach:
- Tokenizes text into words
- Creates word frequency distribution
- Maps to 1024-dimensional vector using hashing
- Deterministic: same text always produces same embedding

**Note**: For production, consider using:
- OpenAI embeddings (ada-002)
- Google PaLM embeddings
- Sentence-BERT models
- Cohere embeddings

## Chunking Strategy

- **Chunk Size**: 1000 characters
- **Overlap**: 200 characters
- **Smart Boundaries**: Breaks at sentence/paragraph boundaries when possible
- **Metadata**: Each chunk includes page info, index, and total count

## Configuration

### Backend Environment Variables
```
PINECONE_API_KEY=your_pinecone_api_key
PORT=3000
```

### Pinecone Setup
- Index Name: `test-data`
- Dimensions: 1024
- Metric: cosine similarity

## Usage Guide

### For Users

1. **Navigate to Chat**:
   - Go to `http://localhost:5174/chat`

2. **Upload Document**:
   - Click "Click to upload" in the sidebar
   - Select a PDF file (max 10MB)
   - Click "Upload & Process"
   - Wait for confirmation message

3. **Start Chatting**:
   - Document is auto-selected after upload
   - Or manually select from dropdown
   - Type your question in the input field
   - Press Enter or click Send
   - View AI-generated answers with relevance scores

4. **Upload Multiple Documents**:
   - Upload more PDFs as needed
   - Switch between documents using the dropdown
   - Each maintains its own conversation context

### For Developers

1. **Customize Chunking**:
   ```typescript
   const chunks = chunkText(text, 1500, 300); // Larger chunks, more overlap
   ```

2. **Adjust Search Results**:
   ```typescript
   const results = await searchInPinecone(query, namespace, 10); // Return top 10
   ```

3. **Add New Metadata**:
   ```typescript
   metadata: {
     text: chunk,
     filename: filename,
     uploadDate: new Date().toISOString(),
     tags: extractTags(chunk)
   }
   ```

## Limitations & Future Improvements

### Current Limitations
- Simple embedding strategy (not semantic)
- No conversation memory
- Limited to PDF files
- No authentication/user sessions
- No document deletion feature

### Planned Improvements
- [ ] Integrate OpenAI/Google embeddings for better semantic search
- [ ] Add conversation history/memory
- [ ] Support for DOCX, TXT, and other formats
- [ ] User authentication and document management
- [ ] Delete namespace/document functionality
- [ ] Export chat history
- [ ] Multi-language support
- [ ] Streaming responses
- [ ] Document preview in chat
- [ ] Highlighted source references

## Troubleshooting

### Issue: "No namespaces found"
- **Solution**: Upload a PDF first, then refresh the namespace list

### Issue: "Search failed"
- **Solution**: Check Pinecone API key and index name
- Verify namespace exists in Pinecone dashboard

### Issue: "No text extracted from PDF"
- **Solution**: Ensure PDF is text-based, not scanned images
- Try OCR preprocessing for scanned documents

### Issue: Low relevance scores
- **Solution**: 
  - Use more specific queries
  - Consider upgrading to semantic embeddings
  - Adjust chunk size for better context

## Performance Considerations

- **Upload Time**: ~5-30 seconds depending on PDF size
- **Query Time**: ~1-3 seconds
- **Concurrent Users**: Backend can handle multiple simultaneous uploads/queries
- **Storage**: Each chunk uses ~4KB in Pinecone

## Security Notes

- API keys should be in `.env` file (not committed to git)
- File size limited to 10MB
- Only PDF files accepted
- Consider adding rate limiting for production
- Implement user authentication for multi-tenant use

## Testing

Test the API endpoints using curl or the provided test script:

```bash
# Upload PDF
curl -X POST http://localhost:3000/api/chat/upload \
  -F "pdf=@/path/to/document.pdf"

# Query
curl -X POST http://localhost:3000/api/chat/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What is this about?", "namespace": "document_1234567890"}'

# List namespaces
curl http://localhost:3000/api/chat/namespaces
```

## Support

For issues or questions:
1. Check the browser console for frontend errors
2. Check backend logs for API errors
3. Verify Pinecone dashboard for data storage
4. Review this documentation

---

Built with ❤️ using React, TypeScript, Express, and Pinecone

