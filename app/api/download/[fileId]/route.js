import { BlobServiceClient } from '@azure/storage-blob';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { CosmosClient } from '@azure/cosmos';

// Same encryption config
const ENCRYPTION_ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = crypto.scRandomBytes(32); // Must match upload key
const IV_LENGTH = 16;

const cosmosClient = new CosmosClient(process.env.AZURE_COSMOSDB_CONNECTION_STRING);
const database = cosmosClient.database('fileshareDB');
const container = database.container('files');

function decryptBuffer(encryptedBuffer) {
  const iv = encryptedBuffer.slice(0, IV_LENGTH);
  const encrypted = encryptedBuffer.slice(IV_LENGTH);
  
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY, iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  
  return decrypted;
}

export async function GET(req, { params }) {
  try {
    const { fileId } = params;

    // Get file metadata from Cosmos DB
    const { resource: fileMetadata } = await container.item(fileId, fileId).read();

    if (!fileMetadata) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Check if file has expired
    const now = new Date();
    const expiryDate = new Date(fileMetadata.expiresAt);

    if (now > expiryDate || fileMetadata.isExpired) {
      // Delete the blob
      const blobServiceClient = BlobServiceClient.fromConnectionString(
        process.env.AZURE_STORAGE_ACCOUNT_CONNECTION_STRING
      );
      const containerClient = blobServiceClient.getContainerClient('fileshare-uploads');
      const blobClient = containerClient.getBlockBlobClient(fileMetadata.blobName);
      
      await blobClient.deleteIfExists();

      // Mark as expired in DB
      await container.item(fileId, fileId).patch([
        { op: 'replace', path: '/isExpired', value: true }
      ]);

      return NextResponse.json(
        { error: 'File has expired and has been deleted' },
        { status: 410 }
      );
    }

    // Download encrypted file from blob storage
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_ACCOUNT_CONNECTION_STRING
    );
    const containerClient = blobServiceClient.getContainerClient('fileshare-uploads');
    const blobClient = containerClient.getBlockBlobClient(fileMetadata.blobName);

    const downloadResponse = await blobClient.download();
    const encryptedBuffer = await streamToBuffer(downloadResponse.readableStreamBody);

    // Decrypt the file
    const decryptedBuffer = decryptBuffer(encryptedBuffer);

    // Update download count
    await container.item(fileId, fileId).patch([
      { op: 'replace', path: '/downloadCount', value: fileMetadata.downloadCount + 1 }
    ]);

    // Return decrypted file
    return new NextResponse(decryptedBuffer, {
      headers: {
        'Content-Type': fileMetadata.originalContentType,
        'Content-Disposition': `attachment; filename="${fileMetadata.fileName}"`,
        'Content-Length': decryptedBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Download failed', message: error.message },
      { status: 500 }
    );
  }
}

// Helper function to convert stream to buffer
async function streamToBuffer(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on('data', (data) => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data));
    });
    readableStream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    readableStream.on('error', reject);
  });
}
