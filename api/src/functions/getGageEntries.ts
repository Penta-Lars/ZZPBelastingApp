import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { AzureStorageGageRepository } from '../repositories/AzureStorageGageRepository';
import type { ApiResponse, GageEntry } from '../types';

/**
 * Azure Function: Haal alle inkomsten op voor de ingelogde gebruiker
 * GET /api/getGageEntries?year=2025   (jaar optioneel)
 */
export async function getGageEntries(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('getGageEntries triggered');

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
    const repo = new AzureStorageGageRepository(connectionString);
    let entries: GageEntry[] = await repo.getEntriesByUser(userId);

    if (yearParam) {
      const year = parseInt(yearParam, 10);
      entries = entries.filter(e => new Date(e.date).getFullYear() === year);
    }

    return {
      status: 200,
      body: JSON.stringify({ success: true, data: entries } as ApiResponse<GageEntry[]>),
    };
  } catch (error) {
    context.error(`getGageEntries error: ${(error as Error).message}`);
    return {
      status: 500,
      body: JSON.stringify({ success: false, error: 'Ophalen mislukt' } as ApiResponse<null>),
    };
  }
}

app.http('getGageEntries', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: getGageEntries,
});
