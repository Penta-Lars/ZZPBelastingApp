import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { AzureStorageExpenseRepository } from '../repositories/AzureStorageExpenseRepository';
import type { SaveExpenseRequest, ApiResponse, ExpenseEntry } from '../types';

/**
 * Azure Function: Sla een uitgave (bonnetje) op
 * POST /api/saveExpenseEntry
 */
export async function saveExpenseEntry(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('saveExpenseEntry triggered');

  const userId = request.headers.get('x-ms-client-principal-id');
  if (!userId) {
    return {
      status: 401,
      body: JSON.stringify({ success: false, error: 'Unauthorized' } as ApiResponse<null>),
    };
  }

  let body: SaveExpenseRequest;
  try {
    body = (await request.json()) as SaveExpenseRequest;
  } catch {
    return {
      status: 400,
      body: JSON.stringify({ success: false, error: 'Invalid JSON' } as ApiResponse<null>),
    };
  }

  const { date, description, category, amountIncludingVAT, vatRateOnExpense, isDepreciableAsset } = body;
  if (!date || !description || !category || amountIncludingVAT === undefined || isDepreciableAsset === undefined) {
    return {
      status: 400,
      body: JSON.stringify({
        success: false,
        error: 'Verplichte velden: date, description, category, amountIncludingVAT, vatRateOnExpense, isDepreciableAsset',
      } as ApiResponse<null>),
    };
  }

  if (body.isDepreciableAsset && !body.usefulLifeYears) {
    body.usefulLifeYears = 5; // Standaard 5 jaar voor instrumenten
  }

  try {
    const connectionString = process.env.AzureWebJobsStorage!;
    if (!connectionString) throw new Error('AzureWebJobsStorage not set');

    const repo = new AzureStorageExpenseRepository(connectionString);
    const entry = await repo.saveExpense(userId, body);

    return {
      status: 201,
      body: JSON.stringify({ success: true, data: entry } as ApiResponse<ExpenseEntry>),
    };
  } catch (error) {
    context.error(`saveExpenseEntry error: ${(error as Error).message}`);
    return {
      status: 500,
      body: JSON.stringify({ success: false, error: 'Opslaan mislukt' } as ApiResponse<null>),
    };
  }
}

app.http('saveExpenseEntry', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: saveExpenseEntry,
});
