import { BlobServiceClient } from '@azure/storage-blob';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name;
    const contentType = file.type;

    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_ACCOUNT_CONNECTION_STRING
    );

    const containerClient = blobServiceClient.getContainerClient('fileshare-uploads');
    
    const blobClient = containerClient.getBlockBlobClient(fileName);

    await blobClient.uploadData(buffer, {
      blobHTTPHeaders: { blobContentType: contentType }
    });

    const blobUrl = blobClient.url;

    return NextResponse.json({ 
      success: true, 
      url: blobUrl 
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}