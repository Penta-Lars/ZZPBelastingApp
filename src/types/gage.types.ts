/**
 * Types voor Gage/Inkomsten berekeningen
 * Volgt Nederlandse BTW-regels voor ZZP muzici
 */

export type VATRateType = 'performance' | 'standard';
export type GageCategory = 'Instrumenten' | 'Studio' | 'Reiskosten' | 'Bladmuziek' | 'Concertkleding' | 'Optreden';

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

export interface GageEntry {
  id: string;
  userId: string;
  date: string; // ISO 8601 format
  description: string;
  category: GageCategory;
  amount: GageAmount;
  createdAt: string;
  updatedAt: string;
}

export interface QuarterlyVATSummary {
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  year: number;
  performanceTotal: GageAmount;
  standardTotal: GageAmount;
  grandTotal: {
    amountExcludingVAT: number;
    totalVAT: number;
    amountIncludingVAT: number;
  };
}

export interface SaveGageEntryRequest {
  date: string;
  description: string;
  category: GageCategory;
  amountIncludingVAT: number;
  vatRate: VATRateType;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
