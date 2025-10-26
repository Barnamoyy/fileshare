import { BlobServiceClient } from '@azure/storage-blob';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { CosmosClient } from '@azure/cosmos';
import crypto from 'crypto';

const cosmosClient = new CosmosClient(process.env.AZURE_COSMOSDB_CONNECTION_STRING);
const database = cosmosClient.database('fileshareDB');
const container = database.container('files');

const ENCRYPTION_ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; 

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const owner = formData.get('owner');
    const expiryHours = parseInt(formData.get('expiryHours'), 10) || 24;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileId = uuidv4();
    const fileName = file.name;
    const contentType = file.type;

    const encryptionKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, encryptionKey, iv);
    const encryptedBuffer = Buffer.concat([iv, cipher.update(buffer), cipher.final()]);

    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_ACCOUNT_CONNECTION_STRING
    );

    const containerClient = blobServiceClient.getContainerClient('fileshare-uploads');
    
    const blobClient = containerClient.getBlockBlobClient(fileId);

    await blobClient.uploadData(encryptedBuffer, {
      blobHTTPHeaders: { blobContentType: 'application/octet-stream' }
    });

    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);
    const shareableUrl = `${process.env.NEXTAUTH_URL}/download/${fileId}`;

    const newItem = {
      id: fileId,
      fileName,
      originalContentType: contentType,
      blobName: fileId,
      ownerName: owner,
      expiresAt: expiresAt.toISOString(),
      downloadCount: 0,
      isExpired: false,
      encryptionKey: encryptionKey.toString('hex'),
      iv: iv.toString('hex'),
    };

    await container.items.create(newItem);

    return NextResponse.json({
      success: true,
      fileId,
      shareableUrl,
      expiresAt: expiresAt.toISOString(),
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}