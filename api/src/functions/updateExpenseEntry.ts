import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { AzureStorageExpenseRepository } from '../repositories/AzureStorageExpenseRepository';
import type { SaveExpenseRequest, ApiResponse, ExpenseEntry } from '../types';

/**
 * PUT /api/updateExpenseEntry
 * Body: { id: string } & SaveExpenseRequest
 */
export async function updateExpenseEntry(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('updateExpenseEntry triggered');

  const userId = request.headers.get('x-ms-client-principal-id');
  if (!userId) {
    return { status: 401, body: JSON.stringify({ success: false, error: 'Unauthorized' } as ApiResponse<null>) };
  }

  let body: { id: string } & SaveExpenseRequest;
  try {
    body = (await request.json()) as { id: string } & SaveExpenseRequest;
  } catch {
    return { status: 400, body: JSON.stringify({ success: false, error: 'Invalid JSON' } as ApiResponse<null>) };
  }

  if (!body.id) {
    return { status: 400, body: JSON.stringify({ success: false, error: 'id vereist' } as ApiResponse<null>) };
  }

  try {
    const repo = new AzureStorageExpenseRepository(process.env.AzureWebJobsStorage!);
    const { id, ...fields } = body;
    const entry = await repo.updateExpense(userId, id, fields);
    return { status: 200, body: JSON.stringify({ success: true, data: entry } as ApiResponse<ExpenseEntry>) };
  } catch (error) {
    context.error(`updateExpenseEntry error: ${(error as Error).message}`);
    return { status: 500, body: JSON.stringify({ success: false, error: 'Bijwerken mislukt' } as ApiResponse<null>) };
  }
}

app.http('updateExpenseEntry', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  handler: updateExpenseEntry,
});
