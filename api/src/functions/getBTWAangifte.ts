import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { AzureStorageGageRepository } from '../repositories/AzureStorageGageRepository';
import { AzureStorageExpenseRepository } from '../repositories/AzureStorageExpenseRepository';
import { calculateBTWAangifte } from '../utils/btwCalculator';
import type { ApiResponse, BTWAangifte } from '../types';

/**
 * Azure Function: BTW-aangifte per kwartaal
 * GET /api/getBTWAangifte?quarter=Q1&year=2025
 *
 * Output bevat exact de rubrieken van de Belastingdienst online aangifte:
 *  Rubriek 1a / 1b / 1e – Prestaties binnenland
 *  Rubriek 4b            – Buitenland
 *  Rubriek 5b / 5g       – Voorbelasting & saldo
 */
export async function getBTWAangifte(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('getBTWAangifte triggered');

  const userId = request.headers.get('x-ms-client-principal-id');
  if (!userId) {
    return {
      status: 401,
      body: JSON.stringify({ success: false, error: 'Unauthorized' } as ApiResponse<null>),
    };
  }

  const quarter = (request.query.get('quarter') ?? 'Q1') as 'Q1' | 'Q2' | 'Q3' | 'Q4';
  const yearStr = request.query.get('year');
  const year    = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear();

  if (!['Q1', 'Q2', 'Q3', 'Q4'].includes(quarter)) {
    return {
      status: 400,
      body: JSON.stringify({ success: false, error: 'Ongeldig kwartaal' } as ApiResponse<null>),
    };
  }

  try {
    const cs = process.env.AzureWebJobsStorage!;
    const incomeRepo  = new AzureStorageGageRepository(cs);
    const expenseRepo = new AzureStorageExpenseRepository(cs);

    const [incomeEntries, expenseEntries] = await Promise.all([
      incomeRepo.getEntriesByUser(userId),
      expenseRepo.getExpensesByUser(userId),
    ]);

    const aangifte = calculateBTWAangifte(incomeEntries, expenseEntries, quarter, year);

    return {
      status: 200,
      body: JSON.stringify({ success: true, data: aangifte } as ApiResponse<BTWAangifte>),
    };
  } catch (error) {
    context.error(`getBTWAangifte error: ${(error as Error).message}`);
    return {
      status: 500,
      body: JSON.stringify({ success: false, error: 'BTW-aangifte berekening mislukt' } as ApiResponse<null>),
    };
  }
}

app.http('getBTWAangifte', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: getBTWAangifte,
});
