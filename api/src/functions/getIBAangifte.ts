import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { AzureStorageGageRepository } from '../repositories/AzureStorageGageRepository';
import { AzureStorageExpenseRepository } from '../repositories/AzureStorageExpenseRepository';
import { calculateIBJaarrapport } from '../utils/ibCalculator';
import type { ApiResponse, IBJaarrapport } from '../types';

/**
 * Azure Function: Jaarrapport Inkomstenbelasting
 * GET /api/getIBAangifte?year=2025&starter=false
 *
 * Output volgt de Belastingdienst IB-aangifte (Box 1 – Winst uit onderneming):
 *  Omzet (excl. BTW)
 *  Bedrijfskosten per categorie
 *  Afschrijvingen op investeringen
 *  Zelfstandigenaftrek (art. 3.76 IB 2001)
 *  Startersaftrek      (art. 3.76 lid 3)
 *  MKB-winstvrijstelling (art. 3.79a) – 13,31%
 *  Belastbare winst uit onderneming
 */
export async function getIBAangifte(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('getIBAangifte triggered');

  const userId = request.headers.get('x-ms-client-principal-id');
  if (!userId) {
    return {
      status: 401,
      body: JSON.stringify({ success: false, error: 'Unauthorized' } as ApiResponse<null>),
    };
  }

  const yearStr  = request.query.get('year');
  const year     = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear();
  const starter  = request.query.get('starter') === 'true';

  if (isNaN(year) || year < 2020 || year > 2100) {
    return {
      status: 400,
      body: JSON.stringify({ success: false, error: 'Ongeldig jaar' } as ApiResponse<null>),
    };
  }

  try {
    const cs = process.env.AzureWebJobsStorage!;
    const incomeRepo  = new AzureStorageGageRepository(cs);
    const expenseRepo = new AzureStorageExpenseRepository(cs);

    // Haal ALLE uitgaven op (ook voorgaande jaren vanwege afschrijvingen!)
    const [incomeEntries, allExpenses] = await Promise.all([
      incomeRepo.getEntriesByUser(userId),
      expenseRepo.getExpensesByUser(userId),
    ]);

    const rapport = calculateIBJaarrapport(incomeEntries, allExpenses, year, starter);

    return {
      status: 200,
      body: JSON.stringify({ success: true, data: rapport } as ApiResponse<IBJaarrapport>),
    };
  } catch (error) {
    context.error(`getIBAangifte error: ${(error as Error).message}`);
    return {
      status: 500,
      body: JSON.stringify({ success: false, error: 'IB-rapport berekening mislukt' } as ApiResponse<null>),
    };
  }
}

app.http('getIBAangifte', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: getIBAangifte,
});
