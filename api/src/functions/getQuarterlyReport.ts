import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { AzureStorageGageRepository } from '../repositories/AzureStorageGageRepository';
import { calculateQuarterlySummary } from '../utils/quarterlyCalculator';
import type { QuarterlyVATSummary, ApiResponse } from '../types';

/**
 * Azure Function: Get Quarterly VAT Report
 * GET /api/getQuarterlyReport?quarter=Q1&year=2024
 * Returns BTW-grouped summary for a specific quarter
 * Default: current quarter and year if not specified
 */
export async function getQuarterlyReport(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('HTTP trigger function processed a get quarterly report request.');

  // Extract userId from Entra ID header
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

  // Get query parameters
  const quarter = (request.query.get('quarter') || 'Q1') as 'Q1' | 'Q2' | 'Q3' | 'Q4';
  const yearParam = request.query.get('year');
  const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

  // Validate quarter
  if (!['Q1', 'Q2', 'Q3', 'Q4'].includes(quarter)) {
    return {
      status: 400,
      body: JSON.stringify({
        success: false,
        error: 'Invalid quarter. Must be Q1, Q2, Q3, or Q4',
      } as ApiResponse<null>),
    };
  }

  if (isNaN(year) || year < 2000 || year > 2100) {
    return {
      status: 400,
      body: JSON.stringify({
        success: false,
        error: 'Invalid year',
      } as ApiResponse<null>),
    };
  }

  try {
    const connectionString = process.env.AzureWebJobsStorage;
    if (!connectionString) {
      throw new Error('AzureWebJobsStorage environment variable not set');
    }

    const repository = new AzureStorageGageRepository(connectionString);
    const entries = await repository.getEntriesByQuarter(userId, quarter, year);
    const summary = calculateQuarterlySummary(entries, quarter, year);

    return {
      status: 200,
      body: JSON.stringify({
        success: true,
        data: summary,
      } as ApiResponse<QuarterlyVATSummary>),
    };
  } catch (error) {
    context.error(`Error fetching quarterly report: ${(error as Error).message}`);
    return {
      status: 500,
      body: JSON.stringify({
        success: false,
        error: 'Failed to fetch quarterly report',
      } as ApiResponse<null>),
    };
  }
}

app.http('getQuarterlyReport', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: getQuarterlyReport,
});
