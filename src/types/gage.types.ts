/**
 * Types voor Gage/Inkomsten berekeningen
 * Volgt Nederlandse BTW-regels voor ZZP muzici
 */

export type VATRateType = 'performance' | 'standard';

export interface GageAmount {
  amountIncludingVAT: number;
  amountExcludingVAT: number;
  vatAmount: number;
  vatRate: VATRateType;
}

export interface GageCalculatorConfig {
  performanceVATRate: number; // 0.09 for 9%
  standardVATRate: number;    // 0.21 for 21%
}

// Netherlands-specific VAT configuration for musicians
export const DUTCH_MUSICIAN_VAT_RATES: GageCalculatorConfig = {
  performanceVATRate: 0.09,  // 9% for performances/gigs
  standardVATRate: 0.21,     // 21% for other services
};
