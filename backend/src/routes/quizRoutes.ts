import express from 'express';
import multer from 'multer';
import path from 'path';
import { generateQuizFromPDF, getQuizProgress } from '../controllers/quizController.js';

const router = express.Router();

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'pdf-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max
  }
});

// POST /api/quiz/generate - Generate quiz from uploaded PDF
router.post('/generate', upload.single('pdf'), generateQuizFromPDF);

// GET /api/quiz/progress/:jobId - Get generation progress (future feature)
router.get('/progress/:jobId', getQuizProgress);

export default router;

