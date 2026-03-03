import { BlobServiceClient } from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';
import type { ExpenseEntry, SaveExpenseRequest } from '../types';
import { DUTCH_MUSICIAN_VAT_RATES } from '../types';
import type { IExpenseRepository } from './IExpenseRepository';

/**
 * Azure Blob Storage implementatie voor uitgaven.
 * Opslag: expense-entries/{userId}/{expenseId}.json
 */
export class AzureStorageExpenseRepository implements IExpenseRepository {
  private blobServiceClient: BlobServiceClient;
  private containerName = 'expense-entries';

  constructor(connectionString: string) {
    this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  }

  private async ensureContainer(): Promise<void> {
    const client = this.blobServiceClient.getContainerClient(this.containerName);
    await client.createIfNotExists(); // no public access (default = private)
  }

  async saveExpense(userId: string, request: SaveExpenseRequest): Promise<ExpenseEntry> {
    await this.ensureContainer();

    const expenseId = uuidv4();
    const now = new Date().toISOString();

    // BTW berekening op inkoop
    let vatRate = 0;
    if (request.vatRateOnExpense === 'performance') vatRate = DUTCH_MUSICIAN_VAT_RATES.performanceVATRate;
    else if (request.vatRateOnExpense === 'standard') vatRate = DUTCH_MUSICIAN_VAT_RATES.standardVATRate;

    const amountExcludingVAT = vatRate > 0
      ? request.amountIncludingVAT / (1 + vatRate)
      : request.amountIncludingVAT;
    const vatAmount = request.amountIncludingVAT - amountExcludingVAT;

    const entry: ExpenseEntry = {
      id: expenseId,
      userId,
      date: request.date,
      description: request.description,
      category: request.category,
      amountIncludingVAT: parseFloat(request.amountIncludingVAT.toFixed(2)),
      amountExcludingVAT: parseFloat(amountExcludingVAT.toFixed(2)),
      vatAmount:           parseFloat(vatAmount.toFixed(2)),
      vatRateOnExpense:    request.vatRateOnExpense,
      isDepreciableAsset:  request.isDepreciableAsset,
      usefulLifeYears:     request.usefulLifeYears,
      createdAt: now,
      updatedAt: now,
    };

    const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    const blobName = `${userId}/${expenseId}.json`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const content = JSON.stringify(entry);
    await blockBlobClient.upload(content, Buffer.byteLength(content));

    return entry;
  }

  async getExpensesByUser(userId: string): Promise<ExpenseEntry[]> {
    await this.ensureContainer();
    const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    const entries: ExpenseEntry[] = [];

    for await (const blob of containerClient.listBlobsFlat({ prefix: `${userId}/` })) {
      const blockBlobClient = containerClient.getBlockBlobClient(blob.name);
      const response = await blockBlobClient.download();
      const content = await streamToString(response.readableStreamBody!);
      entries.push(JSON.parse(content) as ExpenseEntry);
    }

    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getExpensesByYear(userId: string, year: number): Promise<ExpenseEntry[]> {
    const all = await this.getExpensesByUser(userId);
    return all.filter(e => new Date(e.date).getFullYear() === year);
  }

  async deleteExpense(userId: string, expenseId: string): Promise<void> {
    await this.ensureContainer();
    const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
    await containerClient.getBlockBlobClient(`${userId}/${expenseId}.json`).delete();
  }
}

async function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: string[] = [];
    stream.on('data', d => chunks.push(d.toString('utf8')));
    stream.on('end', () => resolve(chunks.join('')));
    stream.on('error', reject);
  });
}
