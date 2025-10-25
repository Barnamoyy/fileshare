import { BlobServiceClient } from '@azure/storage-blob';
import { NextResponse } from 'next/server';
import { CosmosClient } from '@azure/cosmos';

const cosmosClient = new CosmosClient(process.env.AZURE_COSMOSDB_CONNECTION_STRING);
const database = cosmosClient.database('fileshare-db');
const container = database.container('files');

export async function GET(req) {
  try {
    // Verify this is called by a cron job or authorized source
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date().toISOString();

    // Query expired files
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.expiresAt < @now AND c.isExpired = false',
      parameters: [{ name: '@now', value: now }]
    };

    const { resources: expiredFiles } = await container.items.query(querySpec).fetchAll();

    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_ACCOUNT_CONNECTION_STRING
    );
    const containerClient = blobServiceClient.getContainerClient('fileshare-uploads');

    let deletedCount = 0;

    for (const file of expiredFiles) {
      try {
        // Delete blob
        const blobClient = containerClient.getBlockBlobClient(file.blobName);
        await blobClient.deleteIfExists();

        // Mark as expired in DB
        await container.item(file.id, file.id).patch([
          { op: 'replace', path: '/isExpired', value: true }
        ]);

        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete file ${file.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Cleaned up ${deletedCount} expired files`
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json(
      { error: 'Cleanup failed', message: error.message },
      { status: 500 }
    );
  }
}
