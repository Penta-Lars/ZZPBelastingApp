import type { GageEntry, ExpenseEntry, IBJaarrapport, ExpenseCategory } from '../types';
import { IB_CONSTANTS_2025 } from '../types';
import {
  calculateAllDepreciations,
  totalDepreciationForYear,
  isDepreciable,
} from './depreciationCalculator';

/**
 * Berekent het jaarrapport voor de Inkomstenbelasting (Box 1 – Winst uit onderneming).
 *
 * Labels volgen de Belastingdienst aangifte IB 2025:
 *  – Omzet (excl. BTW)
 *  – Bedrijfskosten per categorie
 *  – Afschrijvingen
 *  – Zelfstandigenaftrek (art. 3.76 Wet IB 2001)
 *  – Startersaftrek    (art. 3.76 lid 3)
 *  – MKB-winstvrijstelling (art. 3.79a)
 *  – Belastbare winst uit onderneming
 *
 * @param includeStartersaftrek  Vink aan indien dit een startjaar is (max 3x)
 */
export function calculateIBJaarrapport(
  incomeEntries: GageEntry[],
  expenseEntries: ExpenseEntry[],
  year: number,
  includeStartersaftrek = false
): IBJaarrapport {
  const fmt = (n: number) => parseFloat(n.toFixed(2));

  // ── Inkomsten voor dit jaar ───────────────────────────────────────────────
  const yearIncome = incomeEntries.filter(e => new Date(e.date).getFullYear() === year);
  const yearExpenses = expenseEntries.filter(e => new Date(e.date).getFullYear() === year);

  // Omzet excl. BTW (alle gages, ook vrijgesteld)
  const omzetExclBTW = fmt(yearIncome.reduce((s, e) => s + e.amount.amountExcludingVAT, 0));

  // Omzet per BTW-tarief (voor controle)
  const tarief9pct   = fmt(yearIncome.filter(e => e.amount.vatRate === 'performance').reduce((s, e) => s + e.amount.amountExcludingVAT, 0));
  const tarief21pct  = fmt(yearIncome.filter(e => e.amount.vatRate === 'standard').reduce((s, e) => s + e.amount.amountExcludingVAT, 0));
  const vrijgesteld  = fmt(yearIncome.filter(e => e.amount.vatRate === 'exempt').reduce((s, e) => s + e.amount.amountExcludingVAT, 0));

  // ── Bedrijfskosten per categorie (excl. afschrijvingen en investeringen) ──
  // Activa boven €450 worden geactiveerd → NIET als directe kosten, maar via afschrijving
  const nonDepreciableExpenses = yearExpenses.filter(e => !isDepreciable(e));

  const categories: ExpenseCategory[] = [
    'Instrumenten', 'Studio', 'Reiskosten', 'Bladmuziek',
    'Concertkleding', 'Vakliteratuur', 'Marketing', 'Kantoorkosten', 'Overig',
  ];

  const bedrijfskosten: Record<ExpenseCategory, number> = {} as Record<ExpenseCategory, number>;
  for (const cat of categories) {
    bedrijfskosten[cat] = fmt(
      nonDepreciableExpenses
        .filter(e => e.category === cat)
        .reduce((s, e) => s + e.amountExcludingVAT, 0)
    );
  }

  const totaleBedrijfskosten = fmt(
    Object.values(bedrijfskosten).reduce((s, v) => s + v, 0)
  );

  // ── Afschrijvingen ────────────────────────────────────────────────────────
  // Activa die al in EERDERE jaren zijn aangeschaft maar nog lopen, ook meenemen
  const depreciationLines = calculateAllDepreciations(expenseEntries, year);
  const afschrijvingen    = fmt(totalDepreciationForYear(expenseEntries, year));

  // ── Winst ─────────────────────────────────────────────────────────────────
  const winst = fmt(omzetExclBTW - totaleBedrijfskosten - afschrijvingen);

  // ── Ondernemersaftrek ─────────────────────────────────────────────────────
  // Zelfstandigenaftrek: max winst (kan niet negatief maken)
  const zelfstandigenaftrek = Math.min(IB_CONSTANTS_2025.zelfstandigenaftrek, Math.max(0, winst));
  const startersaftrek      = includeStartersaftrek
    ? Math.min(IB_CONSTANTS_2025.startersaftrek, Math.max(0, winst - zelfstandigenaftrek))
    : 0;

  const winstNaOndernemersaftrek = fmt(winst - zelfstandigenaftrek - startersaftrek);

  // ── MKB-winstvrijstelling ─────────────────────────────────────────────────
  // 13,31% van de winst NA ondernemersaftrek (mag ook negatief zijn)
  const mkbWinstvrijstelling = fmt(
    winstNaOndernemersaftrek * IB_CONSTANTS_2025.mkbWinstvrijstellingRate
  );

  // ── Belastbare winst ──────────────────────────────────────────────────────
  const belastbareWinst = fmt(winstNaOndernemersaftrek - mkbWinstvrijstelling);

  return {
    year,
    omzetExclBTW,
    bedrijfskosten,
    totaleBedrijfskosten,
    afschrijvingen,
    depreciationLines,
    winst,
    zelfstandigenaftrek: fmt(zelfstandigenaftrek),
    startersaftrek:      fmt(startersaftrek),
    winstNaOndernemersaftrek,
    mkbWinstvrijstelling,
    belastbareWinst,
    omzetPerTarief: { tarief9pct, tarief21pct, vrijgesteld },
  };
}
