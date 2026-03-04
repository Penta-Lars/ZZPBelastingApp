import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { AzureStorageExpenseRepository } from '../repositories/AzureStorageExpenseRepository';
import type { ApiResponse } from '../types';

/**
 * DELETE /api/deleteExpenseEntry?id=<expenseId>
 */
export async function deleteExpenseEntry(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('deleteExpenseEntry triggered');

  const userId = request.headers.get('x-ms-client-principal-id');
  if (!userId) {
    return { status: 401, body: JSON.stringify({ success: false, error: 'Unauthorized' } as ApiResponse<null>) };
  }

  const entryId = request.query.get('id');
  if (!entryId) {
    return { status: 400, body: JSON.stringify({ success: false, error: 'id vereist' } as ApiResponse<null>) };
  }

  try {
    const repo = new AzureStorageExpenseRepository(process.env.AzureWebJobsStorage!);
    await repo.deleteExpense(userId, entryId);
    return { status: 200, body: JSON.stringify({ success: true, data: null } as ApiResponse<null>) };
  } catch (error) {
    context.error(`deleteExpenseEntry error: ${(error as Error).message}`);
    return { status: 500, body: JSON.stringify({ success: false, error: 'Verwijderen mislukt' } as ApiResponse<null>) };
  }
}

app.http('deleteExpenseEntry', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  handler: deleteExpenseEntry,
});
