import { BlobServiceClient } from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';
import type { GageEntry, SaveGageEntryRequest } from '../types';
import type { IGageRepository } from './IGageRepository';

/**
 * Azure Blob Storage implementation of the GageRepository
 * Stores each gage entry as a JSON blob: userId/entryId.json
 */
export class AzureStorageGageRepository implements IGageRepository {
  private blobServiceClient: BlobServiceClient;
  private containerName = 'gage-entries';

  constructor(connectionString: string) {
    this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  }

  private async ensureContainer(): Promise<void> {
    const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    await containerClient.createIfNotExists({
      access: 'private',
    });
  }

  async saveEntry(userId: string, entry: SaveGageEntryRequest): Promise<GageEntry> {
    await this.ensureContainer();

    const entryId = uuidv4();
    const now = new Date().toISOString();

    // Calculate VAT amounts based on rate
    const vatRate = entry.vatRate === 'performance' ? 0.09 : 0.21;
    const amountExcludingVAT = entry.amountIncludingVAT / (1 + vatRate);
    const vatAmount = entry.amountIncludingVAT - amountExcludingVAT;

    const gageEntry: GageEntry = {
      id: entryId,
      userId,
      date: entry.date,
      description: entry.description,
      category: entry.category,
      amount: {
        amountIncludingVAT: entry.amountIncludingVAT,
        amountExcludingVAT: parseFloat(amountExcludingVAT.toFixed(2)),
        vatAmount: parseFloat(vatAmount.toFixed(2)),
        vatRate: entry.vatRate,
      },
      createdAt: now,
      updatedAt: now,
    };

    const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    const blobName = `${userId}/${entryId}.json`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const content = JSON.stringify(gageEntry);
    await blockBlobClient.upload(content, Buffer.byteLength(content));

    return gageEntry;
  }

  async getEntriesByQuarter(
    userId: string,
    quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4',
    year: number
  ): Promise<GageEntry[]> {
    const allEntries = await this.getEntriesByUser(userId);
    const quarterMonths = {
      Q1: [1, 2, 3],
      Q2: [4, 5, 6],
      Q3: [7, 8, 9],
      Q4: [10, 11, 12],
    };

    const months = quarterMonths[quarter];

    return allEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return (
        entryDate.getFullYear() === year &&
        months.includes(entryDate.getMonth() + 1)
      );
    });
  }

  async getEntriesByUser(userId: string): Promise<GageEntry[]> {
    await this.ensureContainer();
    const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    const entries: GageEntry[] = [];

    for await (const blob of containerClient.listBlobsFlat({ prefix: `${userId}/` })) {
      const blockBlobClient = containerClient.getBlockBlobClient(blob.name);
      const downloadBlockBlobResponse = await blockBlobClient.download();
      const downloaded = await streamToString(downloadBlockBlobResponse.readableStreamBody!);
      entries.push(JSON.parse(downloaded) as GageEntry);
    }

    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async deleteEntry(userId: string, entryId: string): Promise<void> {
    await this.ensureContainer();
    const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    const blobName = `${userId}/${entryId}.json`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.delete();
  }
}

async function streamToString(readableStream: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: string[] = [];
    readableStream.on('data', (data) => {
      chunks.push(data.toString('utf8'));
    });
    readableStream.on('end', () => {
      resolve(chunks.join(''));
    });
    readableStream.on('error', reject);
  });
}
