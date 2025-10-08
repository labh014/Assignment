import { Conversation } from '../models/Conversation.js';
import fs from 'fs';
import path from 'path';

/**
 * Update existing conversations with localFileId by matching filenames
 */
export async function updateLocalFileIds() {
  try {
    console.log('🔄 Updating conversations with local file IDs...');
    
    const uploadsDir = path.join(process.cwd(), 'uploads');
    
    // Get all PDF files in uploads directory
    const files = fs.readdirSync(uploadsDir).filter(f => f.endsWith('.pdf'));
    console.log(`📁 Found ${files.length} PDF files in uploads directory`);
    
    // Get all conversations without localFileId
    const conversations = await Conversation.find({ 
      isActive: true,
      localFileId: { $exists: false }
    });
    
    console.log(`📊 Found ${conversations.length} conversations without localFileId`);
    
    let updated = 0;
    let notFound = 0;
    
    for (const conv of conversations) {
      // Try to match conversation filename with uploaded files
      const matchingFile = files.find(file => {
        // Match by original filename in the stored filename
        return file.toLowerCase().includes(conv.filename.toLowerCase().replace('.pdf', ''));
      });
      
      if (matchingFile) {
        conv.localFileId = matchingFile;
        await conv.save();
        updated++;
        console.log(`✅ Updated: ${conv.title} → ${matchingFile}`);
      } else {
        notFound++;
        console.log(`⚠️ No file found for: ${conv.title} (${conv.filename})`);
      }
    }
    
    console.log('\n📋 Update Summary:');
    console.log(`   Updated: ${updated}`);
    console.log(`   Not Found: ${notFound}`);
    console.log(`   Total: ${conversations.length}`);
    
    return {
      success: true,
      updated,
      notFound,
      total: conversations.length
    };
    
  } catch (error) {
    console.error('❌ Update failed:', error);
    throw error;
  }
}


