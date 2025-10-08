import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { 
  uploadPDF, 
  queryChatbot, 
  listNamespaces, 
  getConversationHistory, 
  getAllConversations, 
  createConversation, 
  deleteConversation,
  getPDFUrlByNamespace,
  migrateExistingPDFs,
  updateConversationsWithLocalFiles
} from '../controllers/chatController.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Routes
router.post('/upload', upload.single('pdf'), uploadPDF);
router.post('/query', queryChatbot);
router.get('/namespaces', listNamespaces);

// Conversation management routes
router.get('/conversations', getAllConversations);
router.get('/conversations/:namespace', getConversationHistory);
router.post('/conversations', createConversation);
router.delete('/conversations/:conversationId', deleteConversation);

// PDF URL routes
router.get('/pdf/:namespace', getPDFUrlByNamespace);

// Migration routes
router.post('/migrate', migrateExistingPDFs);
router.post('/update-local-files', updateConversationsWithLocalFiles);

export default router;

