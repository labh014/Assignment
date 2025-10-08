import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  metadata?: {
    confidence?: 'high' | 'medium' | 'low';
    sources?: string[];
    query?: string;
    namespace?: string;
  };
}

const MessageSchema = new Schema<IMessage>({
  type: {
    type: String,
    enum: ['user', 'bot'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    confidence: {
      type: String,
      enum: ['high', 'medium', 'low']
    },
    sources: [String],
    query: String,
    namespace: String
  }
});

export const Message = mongoose.model<IMessage>('Message', MessageSchema);


