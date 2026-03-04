import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { AzureStorageGageRepository } from '../repositories/AzureStorageGageRepository';
import type { ApiResponse } from '../types';

/**
 * DELETE /api/deleteGageEntry?id=<entryId>
 */
export async function deleteGageEntry(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('deleteGageEntry triggered');

  const userId = request.headers.get('x-ms-client-principal-id');
  if (!userId) {
    return { status: 401, body: JSON.stringify({ success: false, error: 'Unauthorized' } as ApiResponse<null>) };
  }

  const entryId = request.query.get('id');
  if (!entryId) {
    return { status: 400, body: JSON.stringify({ success: false, error: 'id vereist' } as ApiResponse<null>) };
  }

  try {
    const repo = new AzureStorageGageRepository(process.env.AzureWebJobsStorage!);
    await repo.deleteEntry(userId, entryId);
    return { status: 200, body: JSON.stringify({ success: true, data: null } as ApiResponse<null>) };
  } catch (error) {
    context.error(`deleteGageEntry error: ${(error as Error).message}`);
    return { status: 500, body: JSON.stringify({ success: false, error: 'Verwijderen mislukt' } as ApiResponse<null>) };
  }
}

app.http('deleteGageEntry', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  handler: deleteGageEntry,
});
