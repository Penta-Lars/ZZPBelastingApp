import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { AzureStorageGageRepository } from '../repositories/AzureStorageGageRepository';
import type { SaveGageEntryRequest, ApiResponse, GageEntry } from '../types';

/**
 * Azure Function: Save Gage Entry
 * POST /api/saveGageEntry
 * Saves a new gage/income entry to Azure Blob Storage
 * Requires Entra ID authentication via Static Web Apps header
 */
export async function saveGageEntry(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('HTTP trigger function processed a save gage entry request.');

  // Extract userId from Entra ID header (Static Web Apps)
  const userId = request.headers.get('x-ms-client-principal-id');
  if (!userId) {
    return {
      status: 401,
      body: JSON.stringify({
        success: false,
        error: 'Unauthorized: User ID not found',
      } as ApiResponse<null>),
    };
  }

  // Parse request body
  let requestData: SaveGageEntryRequest;
  try {
    requestData = (await request.json()) as SaveGageEntryRequest;
  } catch {
    return {
      status: 400,
      body: JSON.stringify({
        success: false,
        error: 'Invalid JSON in request body',
      } as ApiResponse<null>),
    };
  }

  // Validate required fields
  const { date, description, category, amountIncludingVAT, vatRate } = requestData;
  if (!date || !description || !category || amountIncludingVAT === undefined || !vatRate) {
    return {
      status: 400,
      body: JSON.stringify({
        success: false,
        error: 'Missing required fields: date, description, category, amountIncludingVAT, vatRate',
      } as ApiResponse<null>),
    };
  }

  if (amountIncludingVAT <= 0) {
    return {
      status: 400,
      body: JSON.stringify({
        success: false,
        error: 'Amount must be greater than 0',
      } as ApiResponse<null>),
    };
  }

  try {
    const connectionString = process.env.AzureWebJobsStorage;
    if (!connectionString) {
      throw new Error('AzureWebJobsStorage environment variable not set');
    }

    const repository = new AzureStorageGageRepository(connectionString);
    const entry = await repository.saveEntry(userId, requestData);

    return {
      status: 201,
      body: JSON.stringify({
        success: true,
        data: entry,
      } as ApiResponse<GageEntry>),
    };
  } catch (error) {
    context.error(`Error saving gage entry: ${(error as Error).message}`);
    return {
      status: 500,
      body: JSON.stringify({
        success: false,
        error: 'Failed to save gage entry',
      } as ApiResponse<null>),
    };
  }
}

app.http('saveGageEntry', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: saveGageEntry,
});
