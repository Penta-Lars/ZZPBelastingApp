import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { AzureStorageGageRepository } from '../repositories/AzureStorageGageRepository';
import type { ApiResponse, GageEntry, SaveGageEntryRequest } from '../types';

/**
 * PUT /api/updateGageEntry
 * Body: { id: string } & SaveGageEntryRequest
 */
export async function updateGageEntry(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('updateGageEntry triggered');

  const userId = request.headers.get('x-ms-client-principal-id');
  if (!userId) {
    return { status: 401, body: JSON.stringify({ success: false, error: 'Unauthorized' } as ApiResponse<null>) };
  }

  let body: { id: string } & SaveGageEntryRequest;
  try {
    body = await request.json() as { id: string } & SaveGageEntryRequest;
  } catch {
    return { status: 400, body: JSON.stringify({ success: false, error: 'Ongeldig JSON' } as ApiResponse<null>) };
  }

  if (!body.id) {
    return { status: 400, body: JSON.stringify({ success: false, error: 'id vereist' } as ApiResponse<null>) };
  }

  try {
    const repo = new AzureStorageGageRepository(process.env.AzureWebJobsStorage!);
    const updated = await repo.updateEntry(userId, body.id, body);
    return { status: 200, body: JSON.stringify({ success: true, data: updated } as ApiResponse<GageEntry>) };
  } catch (error) {
    context.error(`updateGageEntry error: ${(error as Error).message}`);
    return { status: 500, body: JSON.stringify({ success: false, error: 'Bijwerken mislukt' } as ApiResponse<null>) };
  }
}

app.http('updateGageEntry', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  handler: updateGageEntry,
});
