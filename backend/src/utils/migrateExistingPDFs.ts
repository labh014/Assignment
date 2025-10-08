import { Conversation } from '../models/Conversation.js';
import { getNamespaces } from '../services/pineconeService.js';

/**
 * This utility helps migrate existing Pinecone namespaces to MongoDB
 * For PDFs that were uploaded before Cloudinary integration
 */
export async function migrateExistingNamespaces() {
  try {
    console.log('🔄 Starting migration of existing Pinecone namespaces...');
    
    // Get all namespaces from Pinecone
    const pineconeNamespaces = await getNamespaces();
    console.log(`📊 Found ${pineconeNamespaces.length} namespaces in Pinecone`);
    
    let created = 0;
    let existing = 0;
    let skipped = 0;
    
    for (const ns of pineconeNamespaces) {
      try {
        // Check if conversation already exists
        const existingConv = await Conversation.findOne({ 
          namespace: ns.name, 
          isActive: true 
        });
        
        if (existingConv) {
          existing++;
          console.log(`✓ Conversation already exists for: ${ns.displayName}`);
          continue;
        }
        
        // Create conversation for this namespace
        const conversation = new Conversation({
          title: `Chat with ${ns.displayName}`,
          namespace: ns.name,
          filename: `${ns.displayName}.pdf`,
          messages: [],
          isActive: true,
          // Note: cloudinaryUrl will be null for old PDFs
          // Users will need to re-upload if they want PDF viewing
        });
        
        await conversation.save();
        created++;
        console.log(`✅ Created conversation for: ${ns.displayName}`);
        
      } catch (error) {
        skipped++;
        console.error(`❌ Error processing namespace ${ns.name}:`, error);
      }
    }
    
    console.log('\n📋 Migration Summary:');
    console.log(`   Created: ${created}`);
    console.log(`   Existing: ${existing}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Total: ${pineconeNamespaces.length}`);
    
    return {
      success: true,
      created,
      existing,
      skipped,
      total: pineconeNamespaces.length
    };
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}


