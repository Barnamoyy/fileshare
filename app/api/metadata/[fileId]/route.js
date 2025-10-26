import { NextResponse } from 'next/server';
import { CosmosClient } from '@azure/cosmos';

const cosmosClient = new CosmosClient(process.env.AZURE_COSMOSDB_CONNECTION_STRING);
const database = cosmosClient.database('fileshareDB');
const container = database.container('files');

export async function GET(req, { params }) {
  try {
    const { fileId } = await params;

    const { resource: fileMetadata } = await container.item(fileId, fileId).read();

    if (!fileMetadata) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      fileName: fileMetadata.fileName,
      ownerName: fileMetadata.ownerName,
    });

  } catch (error) {
    console.error('Metadata error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metadata', message: error.message },
      { status: 500 }
    );
  }
}
