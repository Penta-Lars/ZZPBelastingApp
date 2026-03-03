import type { GageEntry, ExpenseEntry, BTWAangifte, BTWRubriek1, BTWRubriek4, BTWRubriek5 } from '../types';

const QUARTER_MONTHS: Record<'Q1' | 'Q2' | 'Q3' | 'Q4', number[]> = {
  Q1: [1, 2, 3],
  Q2: [4, 5, 6],
  Q3: [7, 8, 9],
  Q4: [10, 11, 12],
};

function inQuarter(date: string, quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4', year: number): boolean {
  const d = new Date(date);
  return d.getFullYear() === year && QUARTER_MONTHS[quarter].includes(d.getMonth() + 1);
}

function fmt(n: number): number {
  return parseFloat(n.toFixed(2));
}

/**
 * Berekent de volledige BTW-aangifte voor een kwartaal.
 *
 * Labels volgen EXACT de online aangifte van de Belastingdienst:
 *  Rubriek 1a – hoog tarief (21%)
 *  Rubriek 1b – laag tarief  (9%)
 *  Rubriek 1e – 0% / vrijgesteld
 *  Rubriek 4  – buitenland (inkomsten buiten NL)
 *  Rubriek 5b – voorbelasting
 *  Rubriek 5g – te betalen / terug te ontvangen
 */
export function calculateBTWAangifte(
  incomeEntries: GageEntry[],
  expenseEntries: ExpenseEntry[],
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4',
  year: number
): BTWAangifte {
  // Filter op kwartaal
  const income = incomeEntries.filter(e => inQuarter(e.date, quarter, year));
  const expenses = expenseEntries.filter(e => inQuarter(e.date, quarter, year));

  // ── Rubriek 1 ────────────────────────────────────────────────────────────
  // 1a – 21% (standaard tarief: les 21+, merchandise)
  const r1a_entries = income.filter(e => e.amount.vatRate === 'standard' && !e.isForeignIncome);
  const r1a_omzet  = fmt(r1a_entries.reduce((s, e) => s + e.amount.amountExcludingVAT, 0));
  const r1a_btw    = fmt(r1a_entries.reduce((s, e) => s + e.amount.vatAmount, 0));

  // 1b – 9% (optreden)
  const r1b_entries = income.filter(e => e.amount.vatRate === 'performance' && !e.isForeignIncome);
  const r1b_omzet  = fmt(r1b_entries.reduce((s, e) => s + e.amount.amountExcludingVAT, 0));
  const r1b_btw    = fmt(r1b_entries.reduce((s, e) => s + e.amount.vatAmount, 0));

  // 1e – vrijgesteld / 0%
  const r1e_entries = income.filter(e => e.amount.vatRate === 'exempt' && !e.isForeignIncome);
  const r1e_omzet  = fmt(r1e_entries.reduce((s, e) => s + e.amount.amountExcludingVAT, 0));

  const rubriek1: BTWRubriek1 = {
    rubriek1a_omzetHoogTarief: r1a_omzet,
    rubriek1a_btwHoogTarief:   r1a_btw,
    rubriek1b_omzetLaagTarief: r1b_omzet,
    rubriek1b_btwLaagTarief:   r1b_btw,
    rubriek1c_omzetOverig:     0,
    rubriek1c_btwOverig:       0,
    rubriek1d_btw:             0,
    rubriek1e_omzetVrijgesteld: r1e_omzet,
  };

  // ── Rubriek 4 – buitenland ────────────────────────────────────────────────
  const r4_entries = income.filter(e => e.isForeignIncome);
  const r4b_omzet  = fmt(r4_entries.reduce((s, e) => s + e.amount.amountExcludingVAT, 0));
  const r4b_btw    = fmt(r4_entries.reduce((s, e) => s + e.amount.vatAmount, 0));

  const rubriek4: BTWRubriek4 = {
    rubriek4a_omzet: 0,
    rubriek4a_btw:   0,
    rubriek4b_omzet: r4b_omzet,
    rubriek4b_btw:   r4b_btw,
  };

  // ── Rubriek 5b – voorbelasting (BTW op inkopen) ───────────────────────────
  // Alleen BTW op kosten die belast zijn (niet vrijgesteld)
  const r5b_voorbelasting = fmt(
    expenses
      .filter(e => e.vatRateOnExpense !== 'exempt')
      .reduce((s, e) => s + e.vatAmount, 0)
  );

  const totaalVerschuldigd = fmt(r1a_btw + r1b_btw + r4b_btw);
  const teBetalen          = fmt(totaalVerschuldigd - r5b_voorbelasting);

  const rubriek5: BTWRubriek5 = {
    rubriek5b_voorbelasting: r5b_voorbelasting,
    rubriek5g_teBetalen:     teBetalen,
  };

  const totaleOmzet = fmt(r1a_omzet + r1b_omzet + r1e_omzet + r4b_omzet);

  return {
    quarter,
    year,
    rubriek1,
    rubriek4,
    rubriek5,
    totaleOmzetExclBTW:    totaleOmzet,
    totaalVerschuldigdBTW: totaalVerschuldigd,
  };
}
