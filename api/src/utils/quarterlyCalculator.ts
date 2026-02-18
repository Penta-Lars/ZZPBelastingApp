import type { GageEntry, QuarterlyVATSummary } from '../types';

/**
 * Calculates quarterly VAT summary grouped by rate
 * Ensures correct precision (2 decimals) for financial calculations
 */
export function calculateQuarterlySummary(
  entries: GageEntry[],
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4',
  year: number
): QuarterlyVATSummary {
  const performanceEntries = entries.filter(e => e.amount.vatRate === 'performance');
  const standardEntries = entries.filter(e => e.amount.vatRate === 'standard');

  const performanceTotal = {
    amountIncludingVAT: performanceEntries.reduce((sum, e) => sum + e.amount.amountIncludingVAT, 0),
    amountExcludingVAT: performanceEntries.reduce((sum, e) => sum + e.amount.amountExcludingVAT, 0),
    vatAmount: performanceEntries.reduce((sum, e) => sum + e.amount.vatAmount, 0),
    vatRate: 'performance' as const,
  };

  const standardTotal = {
    amountIncludingVAT: standardEntries.reduce((sum, e) => sum + e.amount.amountIncludingVAT, 0),
    amountExcludingVAT: standardEntries.reduce((sum, e) => sum + e.amount.amountExcludingVAT, 0),
    vatAmount: standardEntries.reduce((sum, e) => sum + e.amount.vatAmount, 0),
    vatRate: 'standard' as const,
  };

  return {
    quarter,
    year,
    performanceTotal: {
      ...performanceTotal,
      amountIncludingVAT: parseFloat(performanceTotal.amountIncludingVAT.toFixed(2)),
      amountExcludingVAT: parseFloat(performanceTotal.amountExcludingVAT.toFixed(2)),
      vatAmount: parseFloat(performanceTotal.vatAmount.toFixed(2)),
    },
    standardTotal: {
      ...standardTotal,
      amountIncludingVAT: parseFloat(standardTotal.amountIncludingVAT.toFixed(2)),
      amountExcludingVAT: parseFloat(standardTotal.amountExcludingVAT.toFixed(2)),
      vatAmount: parseFloat(standardTotal.vatAmount.toFixed(2)),
    },
    grandTotal: {
      amountExcludingVAT: parseFloat(
        (performanceTotal.amountExcludingVAT + standardTotal.amountExcludingVAT).toFixed(2)
      ),
      totalVAT: parseFloat(
        (performanceTotal.vatAmount + standardTotal.vatAmount).toFixed(2)
      ),
      amountIncludingVAT: parseFloat(
        (performanceTotal.amountIncludingVAT + standardTotal.amountIncludingVAT).toFixed(2)
      ),
    },
  };
}
