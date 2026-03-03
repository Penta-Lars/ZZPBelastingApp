import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { AzureStorageExpenseRepository } from '../repositories/AzureStorageExpenseRepository';
import type { ApiResponse, ExpenseEntry } from '../types';

/**
 * Azure Function: Haal uitgaven op (optioneel gefilterd op jaar)
 * GET /api/getExpenseEntries?year=2025
 */
export async function getExpenseEntries(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('getExpenseEntries triggered');

  const userId = request.headers.get('x-ms-client-principal-id');
  if (!userId) {
    return {
      status: 401,
      body: JSON.stringify({ success: false, error: 'Unauthorized' } as ApiResponse<null>),
    };
  }

  const yearParam = request.query.get('year');

  try {
    const connectionString = process.env.AzureWebJobsStorage!;
    const repo = new AzureStorageExpenseRepository(connectionString);

    const entries: ExpenseEntry[] = yearParam
      ? await repo.getExpensesByYear(userId, parseInt(yearParam, 10))
      : await repo.getExpensesByUser(userId);

    return {
      status: 200,
      body: JSON.stringify({ success: true, data: entries } as ApiResponse<ExpenseEntry[]>),
    };
  } catch (error) {
    context.error(`getExpenseEntries error: ${(error as Error).message}`);
    return {
      status: 500,
      body: JSON.stringify({ success: false, error: 'Ophalen mislukt' } as ApiResponse<null>),
    };
  }
}

app.http('getExpenseEntries', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: getExpenseEntries,
});
