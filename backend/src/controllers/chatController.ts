import { Request, Response } from 'express';
import fs from 'fs';
import { extractPDFPages } from '../utils/pdfExtractor.js';
import { chunkText, uploadToPinecone, searchInPinecone, getNamespaces } from '../services/pineconeService.js';
import { generateChatResponse } from '../services/geminiService.js';
import { uploadPDFToCloudinary } from '../services/cloudinaryService.js';
import { migrateExistingNamespaces } from '../utils/migrateExistingPDFs.js';
import { updateLocalFileIds } from '../utils/updateLocalFileIds.js';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';

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
    
    if (!pages || pages.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No text could be extracted from the PDF' 
      });
    }

    console.log(`Text extracted from ${pages.length} pages`);

    // Chunk by pages with smart merging (min 100 words per chunk)
    const pageChunks = pages.map(page => ({
      pageNumber: page.pageNumber,
      text: page.text
    }));
    
    // Import the new chunking function
    const { chunkTextByPages } = await import('../services/pineconeService.js');
    const smartChunks = chunkTextByPages(pageChunks, 100);
    
    console.log(`Smart chunking: ${smartChunks.length} chunks from ${pages.length} pages`);
    
    // Convert to simple text array for Pinecone
    const chunks = smartChunks.map(chunk => chunk.text);

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

    // Upload PDF to Cloudinary
    let cloudinaryResult = null;
    try {
      cloudinaryResult = await uploadPDFToCloudinary(
        req.file.path,
        req.file.originalname,
        namespace
      );
      console.log('✅ PDF uploaded to Cloudinary:', cloudinaryResult.secure_url);
    } catch (cloudinaryError) {
      console.error('❌ Cloudinary upload failed:', cloudinaryError);
      // Continue without Cloudinary upload - don't fail the entire process
    }

    // Create or update conversation with Cloudinary URL
    try {
      let conversation = await Conversation.findOne({ 
        namespace: namespace, 
        isActive: true 
      });

      if (!conversation) {
        conversation = new Conversation({
          title: `Chat with ${req.file.originalname.replace('.pdf', '')}`,
          namespace: namespace,
          filename: req.file.originalname,
          messages: [],
          isActive: true
        });
      }

      // Update Cloudinary URLs if upload was successful
      if (cloudinaryResult) {
        conversation.cloudinaryUrl = cloudinaryResult.secure_url;
        conversation.cloudinaryPublicId = cloudinaryResult.public_id;
      }
      
      // Always save local file ID as fallback
      conversation.localFileId = req.file.filename;

      await conversation.save();
      console.log('✅ Conversation saved with Cloudinary URL');
    } catch (conversationError) {
      console.error('❌ Failed to save conversation:', conversationError);
    }

    // Keep local file as backup (don't delete)
    // This allows future migrations and provides a fallback
    // Comment out the line below if you want to delete files immediately
    // if (cloudinaryResult) {
    //   fs.unlinkSync(req.file.path);
    // }
    console.log('📁 Local file kept as backup:', req.file.path);

    res.json({
      success: true,
      chunks: result.success,
      failed: result.failed,
      totalChunks: chunks.length,
      namespace: namespace,
      filename: req.file.originalname,
      fileId: req.file.filename,
      cloudinaryUrl: cloudinaryResult?.secure_url,
      localFileUrl: cloudinaryResult ? null : `http://localhost:3000/uploads/${req.file.filename}`, // Fallback to local
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

    // Search in Pinecone (get top 5 most relevant chunks)
    const results = await searchInPinecone(query, namespace, 5);

    // Generate intelligent response using Gemini with top 3-5 results
    // Gemini will automatically use 3-5 chunks based on availability
    const geminiResponse = await generateChatResponse(query, results);

    // Save conversation to MongoDB
    await saveConversation(namespace, query, geminiResponse.answer, geminiResponse.confidence, geminiResponse.sources);

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

// Save conversation to MongoDB
async function saveConversation(
  namespace: string, 
  userQuery: string, 
  botAnswer: string, 
  confidence: string, 
  sources: string[]
) {
  try {
    // Find or create conversation for this namespace
    let conversation = await Conversation.findOne({ 
      namespace: namespace, 
      isActive: true 
    }).populate('messages');

    if (!conversation) {
      // Create new conversation
      // Note: This should ideally not happen if PDF was uploaded first
      // But if it does, we create a basic conversation without Cloudinary URL
      // The Cloudinary URL should be set during PDF upload
      conversation = new Conversation({
        title: `Chat with ${namespace.split('_')[0]}`,
        namespace: namespace,
        filename: namespace.split('_')[0] + '.pdf',
        messages: [],
        isActive: true
      });
      await conversation.save();
      console.log('⚠️ Warning: Conversation created without Cloudinary URL. Upload PDF first.');
    }

    // Create user message
    const userMessage = new Message({
      type: 'user',
      content: userQuery,
      metadata: {
        query: userQuery,
        namespace: namespace
      }
    });
    await userMessage.save();

    // Create bot message
    const botMessage = new Message({
      type: 'bot',
      content: botAnswer,
      metadata: {
        confidence: confidence as 'high' | 'medium' | 'low',
        sources: sources,
        namespace: namespace
      }
    });
    await botMessage.save();

    // Add messages to conversation
    conversation.messages.push(userMessage._id as any, botMessage._id as any);
    await conversation.save();

    console.log('✅ Conversation saved to MongoDB');
  } catch (error) {
    console.error('❌ Error saving conversation:', error);
  }
}

// Get conversation history for a namespace
export async function getConversationHistory(req: Request, res: Response) {
  try {
    const { namespace } = req.params;
    console.log('Loading conversation history for namespace:', namespace);

    const conversation = await Conversation.findOne({ 
      namespace: namespace, 
      isActive: true 
    }).populate({
      path: 'messages',
      options: { sort: { timestamp: 1 } }
    });

    if (!conversation) {
      console.log('No conversation found for namespace:', namespace);
      return res.json({
        success: true,
        messages: [],
        conversation: null
      });
    }

    console.log('Found conversation with', conversation.messages.length, 'messages');

    res.json({
      success: true,
      messages: conversation.messages,
      conversation: {
        id: conversation._id,
        title: conversation.title,
        namespace: conversation.namespace,
        filename: conversation.filename,
        cloudinaryUrl: conversation.cloudinaryUrl,
        localFileId: conversation.localFileId,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt
      }
    });

  } catch (error: any) {
    console.error('Error getting conversation history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversation history',
      details: error.message
    });
  }
}

// Get all conversations
export async function getAllConversations(req: Request, res: Response) {
  try {
    const conversations = await Conversation.find({ isActive: true })
      .populate('messages')
      .sort({ updatedAt: -1 })
      .limit(50);

    const conversationList = conversations.map(conv => ({
      id: conv._id,
      title: conv.title,
      namespace: conv.namespace,
      filename: conv.filename,
      cloudinaryUrl: conv.cloudinaryUrl,
      localFileId: conv.localFileId,
      messageCount: conv.messages.length,
      lastMessage: conv.messages.length > 0 ? conv.messages[conv.messages.length - 1] : null,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt
    }));

    res.json({
      success: true,
      conversations: conversationList
    });

  } catch (error: any) {
    console.error('Error getting all conversations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversations',
      details: error.message
    });
  }
}

// Create new conversation
export async function createConversation(req: Request, res: Response) {
  try {
    const { namespace, filename } = req.body;

    if (!namespace || !filename) {
      return res.status(400).json({
        success: false,
        error: 'Namespace and filename are required'
      });
    }

    // Deactivate existing conversation for this namespace
    await Conversation.updateMany(
      { namespace: namespace, isActive: true },
      { isActive: false }
    );

    // Create new conversation
    const conversation = new Conversation({
      title: `Chat with ${filename.replace('.pdf', '')}`,
      namespace: namespace,
      filename: filename,
      messages: [],
      isActive: true
    });

    await conversation.save();

    res.json({
      success: true,
      conversation: {
        id: conversation._id,
        title: conversation.title,
        namespace: conversation.namespace,
        filename: conversation.filename,
        createdAt: conversation.createdAt
      }
    });

  } catch (error: any) {
    console.error('Error creating conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create conversation',
      details: error.message
    });
  }
}

// Delete conversation
export async function deleteConversation(req: Request, res: Response) {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    // Soft delete - mark as inactive
    conversation.isActive = false;
    await conversation.save();

    res.json({
      success: true,
      message: 'Conversation deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete conversation',
      details: error.message
    });
  }
}

// Get PDF URL by namespace
export async function getPDFUrlByNamespace(req: Request, res: Response) {
  try {
    const { namespace } = req.params;
    console.log('Getting PDF URL for namespace:', namespace);

    const conversation = await Conversation.findOne({ 
      namespace: namespace, 
      isActive: true 
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    // Priority: Cloudinary URL > Local File
    let pdfUrl = conversation.cloudinaryUrl;
    let source = 'cloudinary';
    
    if (!pdfUrl && conversation.localFileId) {
      // Fallback to local file if Cloudinary URL not available
      pdfUrl = `http://localhost:3000/uploads/${conversation.localFileId}`;
      source = 'local';
      console.log('📁 Using local file as fallback:', pdfUrl);
    }

    if (!pdfUrl) {
      return res.status(404).json({
        success: false,
        error: 'PDF not found'
      });
    }

    res.json({
      success: true,
      pdfUrl: pdfUrl,
      source: source,
      filename: conversation.filename,
      namespace: conversation.namespace
    });

  } catch (error: any) {
    console.error('Error getting PDF URL:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get PDF URL',
      details: error.message
    });
  }
}

// Migrate existing Pinecone namespaces to MongoDB
export async function migrateExistingPDFs(req: Request, res: Response) {
  try {
    console.log('🔄 Starting migration of existing PDFs...');
    const result = await migrateExistingNamespaces();
    
    res.json({
      ...result,
      message: 'Migration completed'
    });
    
  } catch (error: any) {
    console.error('❌ Migration error:', error);
    res.status(500).json({
      success: false,
      error: 'Migration failed',
      details: error.message
    });
  }
}

// Update existing conversations with local file IDs
export async function updateConversationsWithLocalFiles(req: Request, res: Response) {
  try {
    console.log('🔄 Updating conversations with local file IDs...');
    const result = await updateLocalFileIds();
    
    res.json({
      ...result,
      message: 'Update completed'
    });
    
  } catch (error: any) {
    console.error('❌ Update error:', error);
    res.status(500).json({
      success: false,
      error: 'Update failed',
      details: error.message
    });
  }
}

