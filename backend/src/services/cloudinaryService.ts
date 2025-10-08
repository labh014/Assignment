import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
// IMPORTANT: You need to provide your actual cloud_name!
// Get it from: https://console.cloudinary.com/
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dk799kex1',
  api_key: process.env.CLOUDINARY_API_KEY || '398384428367778',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'W03Qtzx3Q0hgOHI69m5zFyVOVaQ'
});

console.log('🔧 Cloudinary Config:', {
  cloud_name: cloudinary.config().cloud_name,
  api_key: cloudinary.config().api_key ? '***' + cloudinary.config().api_key?.slice(-4) : 'missing'
});

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  original_filename: string;
  format: string;
  resource_type: string;
  bytes: number;
}

/**
 * Upload PDF to Cloudinary
 */
export async function uploadPDFToCloudinary(
  filePath: string,
  filename: string,
  namespace: string
): Promise<CloudinaryUploadResult> {
  try {
    console.log('📤 Uploading PDF to Cloudinary:', filename);
    
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'auto', // Auto-detect resource type (works better for PDFs)
      public_id: `pdfs/${namespace}/${filename.replace('.pdf', '')}`,
      folder: 'rag-chat-pdfs',
      use_filename: true,
      unique_filename: false,
      overwrite: true,
      type: 'upload', // Use upload type (public by default)
      flags: 'attachment' // Serve as downloadable attachment
    });

    console.log('✅ PDF uploaded to Cloudinary:', result.secure_url);
    console.log('📊 Resource type:', result.resource_type);
    
    // Use the direct secure_url from Cloudinary
    // With resource_type: 'auto' and type: 'upload', files are public by default
    
    return {
      public_id: result.public_id,
      secure_url: result.secure_url, // Use direct URL from Cloudinary
      original_filename: result.original_filename || filename,
      format: result.format,
      resource_type: result.resource_type,
      bytes: result.bytes
    };

  } catch (error) {
    console.error('❌ Cloudinary upload error:', error);
    throw new Error('Failed to upload PDF to Cloudinary');
  }
}

/**
 * Get PDF URL from Cloudinary by public_id
 */
export async function getPDFUrlFromCloudinary(publicId: string): Promise<string> {
  try {
    const result = await cloudinary.api.resource(publicId, {
      resource_type: 'raw'
    });
    
    return result.secure_url;
  } catch (error) {
    console.error('❌ Error getting PDF URL from Cloudinary:', error);
    throw new Error('Failed to get PDF URL from Cloudinary');
  }
}

/**
 * Delete PDF from Cloudinary
 */
export async function deletePDFFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: 'raw'
    });
    console.log('✅ PDF deleted from Cloudinary:', publicId);
  } catch (error) {
    console.error('❌ Error deleting PDF from Cloudinary:', error);
    throw new Error('Failed to delete PDF from Cloudinary');
  }
}

/**
 * List all PDFs in a folder
 */
export async function listPDFsInFolder(folder: string = 'rag-chat-pdfs'): Promise<any[]> {
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      resource_type: 'raw',
      prefix: folder,
      max_results: 100
    });
    
    return result.resources;
  } catch (error) {
    console.error('❌ Error listing PDFs from Cloudinary:', error);
    throw new Error('Failed to list PDFs from Cloudinary');
  }
}

