/**
 * Types voor ZZP Muzici BTW- en Inkomstenbelasting-app
 * Volgt exact de Belastingdienst-labels en Nederlandse BTW-regels
 */

// ─── BTW-tarieven ────────────────────────────────────────────────────────────
// 'performance'  = 9%   – uitvoerend optreden
// 'standard'     = 21%  – les aan 21+, merchandise, e.d.
// 'exempt'       = 0%   – les aan minderjarigen (<21), vrijgesteld
export type VATRateType = 'performance' | 'standard' | 'exempt';

// ─── Categorieën Inkomsten ────────────────────────────────────────────────────
export type IncomeCategory =
  | 'Optreden'
  | 'LesgeevenMinderjarigen'
  | 'LesgevenMeerderjarigen'
  | 'Merchandise'
  | 'StudioOpname'
  | 'Overig';

// ─── Categorieën Uitgaven ─────────────────────────────────────────────────────
// Open string type zodat gebruikers eigen categorieën kunnen toevoegen
export type ExpenseCategory = string;

// Backwards compat – gebruikt als GageCategory
export type GageCategory = IncomeCategory | ExpenseCategory;

// ─── BTW-configuratie ─────────────────────────────────────────────────────────
export interface GageCalculatorConfig {
  performanceVATRate: number; // 0.09 for 9%
  standardVATRate: number;    // 0.21 for 21%
}

export const DUTCH_MUSICIAN_VAT_RATES: GageCalculatorConfig = {
  performanceVATRate: 0.09,
  standardVATRate: 0.21,
};

// ─── Fiscale constanten 2025 ──────────────────────────────────────────────────
export const IB_CONSTANTS_2025 = {
  zelfstandigenaftrek: 2470,          // € (uitfasering conform Prinsjesdag 2025)
  startersaftrek: 2123,               // €  extra voor starters (max 3x)
  mkbWinstvrijstellingRate: 0.1331,   // 13,31 % van winst na aftrekposten
  forRate: 0,                         // FOR afgeschaft per 2023
  urencriterium: 1225,                // minimum uren voor zelfstandigenaftrek
  // Investeringsaftrek: drempel afschrijving
  depreciationThreshold: 450,         // € – activa boven dit bedrag activeren
  maxDepreciationPercentPerYear: 0.20 // max 20 % / jaar (restwaarde-methode niet verplicht)
} as const;

// ─── Generieke bedragen ───────────────────────────────────────────────────────
export interface GageAmount {
  amountIncludingVAT: number;
  amountExcludingVAT: number;
  vatAmount: number;
  vatRate: VATRateType;
}

// ─── Inkomsten (facturen) ─────────────────────────────────────────────────────
export interface GageEntry {
  id: string;
  userId: string;
  date: string;          // ISO 8601
  description: string;
  category: IncomeCategory;
  amount: GageAmount;
  /** Rubriek 4 = prestatie buiten Nederland */
  isForeignIncome?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SaveGageEntryRequest {
  date: string;
  description: string;
  category: IncomeCategory;
  amountIncludingVAT: number;
  vatRate: VATRateType;
  isForeignIncome?: boolean;
}

// ─── Uitgaven (bonnetjes) ─────────────────────────────────────────────────────
export interface ExpenseEntry {
  id: string;
  userId: string;
  date: string;
  description: string;
  category: string;
  amountIncludingVAT: number;
  amountExcludingVAT: number;
  /** BTW op inkoop (voor rubriek 5b voorbelasting) */
  vatAmount: number;
  vatRateOnExpense: VATRateType;
  /** Indien true: boven €450 excl. BTW → activeren + afschrijven */
  isDepreciableAsset: boolean;
  /** Gebruiksduur in jaren (standaard 5 voor instrumenten) */
  usefulLifeYears?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SaveExpenseRequest {
  date: string;
  description: string;
  category: string;
  amountIncludingVAT: number;
  vatRateOnExpense: VATRateType;
  isDepreciableAsset: boolean;
  usefulLifeYears?: number;
}

// ─── BTW-aangifte (exact Belastingdienst-labels) ──────────────────────────────
/**
 * Rubriek 1 – Prestaties belast in Nederland
 * Labels = letterlijk van de online aangifte Belastingdienst
 */
export interface BTWRubriek1 {
  /** 1a  Leveringen/diensten belast met hoog tarief (21%) */
  rubriek1a_omzetHoogTarief: number;
  rubriek1a_btwHoogTarief: number;
  /** 1b  Leveringen/diensten belast met laag tarief (9%) */
  rubriek1b_omzetLaagTarief: number;
  rubriek1b_btwLaagTarief: number;
  /** 1c  Leveringen/diensten belast met overige tarieven, geen 0% */
  rubriek1c_omzetOverig: number;
  rubriek1c_btwOverig: number;
  /** 1d  Privégebruik */
  rubriek1d_btw: number;
  /** 1e  Leveringen/diensten belast met 0% of niet bij u belast (vrijgesteld) */
  rubriek1e_omzetVrijgesteld: number;
}

/**
 * Rubriek 4 – Prestaties vanuit het buitenland aan u verricht
 */
export interface BTWRubriek4 {
  /** 4a  Leveringen/diensten uit landen buiten de EU */
  rubriek4a_omzet: number;
  rubriek4a_btw: number;
  /** 4b  Leveringen/diensten uit landen binnen de EU */
  rubriek4b_omzet: number;
  rubriek4b_btw: number;
}

/**
 * Rubriek 5 – Voorbelasting en te betalen/ontvangen BTW
 */
export interface BTWRubriek5 {
  /** 5b  Voorbelasting (BTW betaald op inkopen/kosten) */
  rubriek5b_voorbelasting: number;
  /** 5g  Totaal te betalen (positief) of terug te ontvangen (negatief) */
  rubriek5g_teBetalen: number;
}

/** Complete BTW-aangifte voor één kwartaal */
export interface BTWAangifte {
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  year: number;
  rubriek1: BTWRubriek1;
  rubriek4: BTWRubriek4;
  rubriek5: BTWRubriek5;
  /** Totale omzet excl. BTW (alle rubrieken opgeteld) */
  totaleOmzetExclBTW: number;
  /** Totale verschuldigde BTW (rubriek 1 + 4) */
  totaalVerschuldigdBTW: number;
}

// ─── Inkomstenbelasting (jaarrapport) ────────────────────────────────────────
export interface DepreciationLine {
  expenseId: string;
  description: string;
  purchaseDate: string;
  purchaseCost: number; // excl. BTW
  usefulLifeYears: number;
  annualDepreciation: number;
  depreciationYear: number;
  remainingBookValue: number;
}

/** Winst-en-verliesrekening + IB-aftrekposten – labels conform Belastingdienst */
export interface IBJaarrapport {
  year: number;
  // ── Winst-en-verliesrekening ──
  /** Omzet (excl. BTW) */
  omzetExclBTW: number;
  /** Inkoopkosten en bedrijfskosten per categorie */
  bedrijfskosten: Record<ExpenseCategory, number>;
  /** Totale bedrijfskosten (excl. afschrijvingen) */
  totaleBedrijfskosten: number;
  /** Afschrijvingen op investeringen */
  afschrijvingen: number;
  depreciationLines: DepreciationLine[];
  /** Bedrijfsresultaat voor aftrekposten */
  winst: number;
  // ── Aftrekposten ondernemer ──
  /** Zelfstandigenaftrek (art. 3.76 IB) */
  zelfstandigenaftrek: number;
  /** Startersaftrek (art. 3.76 lid 3 IB) – optioneel */
  startersaftrek: number;
  /** Winst na ondernemersaftrek */
  winstNaOndernemersaftrek: number;
  /** MKB-winstvrijstelling 13,31% */
  mkbWinstvrijstelling: number;
  /** Belastbare winst uit onderneming (vult u in bij Box 1) */
  belastbareWinst: number;
  /** Jaaromzet per BTW-tarief (voor controle) */
  omzetPerTarief: {
    tarief9pct: number;
    tarief21pct: number;
    vrijgesteld: number;
  };
}

// ─── Kwartaalrapport (bestaand, uitgebreid) ───────────────────────────────────
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

// ─── API helpers ──────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
