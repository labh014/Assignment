import mongoose, { Document, Schema } from 'mongoose';
import { IMessage } from './Message.js';

export interface IConversation extends Document {
  title: string;
  namespace: string; // Pinecone namespace for the document
  filename: string; // Original PDF filename
  cloudinaryUrl?: string; // Cloudinary PDF URL
  cloudinaryPublicId?: string; // Cloudinary public ID
  localFileId?: string; // Local file ID (stored filename)
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

const ConversationSchema = new Schema<IConversation>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  namespace: {
    type: String,
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  cloudinaryUrl: {
    type: String
  },
  cloudinaryPublicId: {
    type: String
  },
  localFileId: {
    type: String
  },
  messages: [{
    type: Schema.Types.ObjectId,
    ref: 'Message'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// Update the updatedAt field before saving
ConversationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create index for better query performance
ConversationSchema.index({ namespace: 1, createdAt: -1 });
ConversationSchema.index({ isActive: 1, updatedAt: -1 });

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);
