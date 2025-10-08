// Quick test to verify Cloudinary connection
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: 'dxy8m8q8k',
  api_key: '398384428367778',
  api_secret: 'W03Qtzx3Q0hgOHI69m5zFyVOVaQ'
});

async function testCloudinary() {
  try {
    console.log('Testing Cloudinary connection...');
    
    // Test with a simple file
    const testFile = './uploads/1759870524293-Evc unit 3 water pollution.pdf';
    
    console.log('Uploading test file:', testFile);
    const result = await cloudinary.uploader.upload(testFile, {
      resource_type: 'raw',
      folder: 'rag-chat-pdfs',
      public_id: 'test-upload'
    });
    
    console.log('✅ SUCCESS! Cloudinary is working!');
    console.log('URL:', result.secure_url);
    console.log('Public ID:', result.public_id);
    
  } catch (error) {
    console.error('❌ FAILED! Cloudinary error:', error);
  }
}

testCloudinary();

