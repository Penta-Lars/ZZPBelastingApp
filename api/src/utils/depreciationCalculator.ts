import type { ExpenseEntry, DepreciationLine } from '../types';
import { IB_CONSTANTS_2025 } from '../types';

/**
 * Berekent afschrijvingen voor activa boven de €450 (excl. BTW).
 * NL-regel: lineaire afschrijving, min. 5 jaar / max. 20% per jaar.
 */

export function isDepreciable(expenseEntry: ExpenseEntry): boolean {
  return (
    expenseEntry.isDepreciableAsset &&
    expenseEntry.amountExcludingVAT > IB_CONSTANTS_2025.depreciationThreshold
  );
}

/**
 * Berekent de jaarlijkse afschrijving (lineaire methode).
 * Eerste jaar: pro-rata op basis van aankoopdatum.
 */
export function calculateAnnualDepreciation(
  expense: ExpenseEntry,
  forYear: number
): DepreciationLine | null {
  if (!isDepreciable(expense)) return null;

  const usefulLife = expense.usefulLifeYears ?? 5;
  const purchaseDate = new Date(expense.date);
  const purchaseYear = purchaseDate.getFullYear();

  // Actief is voor dit jaar niet in gebruik
  const endYear = purchaseYear + usefulLife - 1;
  if (forYear < purchaseYear || forYear > endYear) return null;

  const annualAmount = expense.amountExcludingVAT / usefulLife;

  // Eerste jaar: pro-rata op maanden
  let depreciationForYear = annualAmount;
  if (forYear === purchaseYear) {
    const monthsInFirstYear = 12 - purchaseDate.getMonth(); // jan=0
    depreciationForYear = (annualAmount * monthsInFirstYear) / 12;
  }
  depreciationForYear = parseFloat(depreciationForYear.toFixed(2));

  // Restwaarde = aankoopprijs - reeds afgeschreven
  const yearsDepreciated = forYear - purchaseYear;
  const alreadyDepreciated = Math.min(
    expense.amountExcludingVAT,
    annualAmount * (yearsDepreciated === 0 ? 0 : yearsDepreciated)
  );
  const remainingBookValue = parseFloat(
    Math.max(0, expense.amountExcludingVAT - alreadyDepreciated - depreciationForYear).toFixed(2)
  );

  return {
    expenseId: expense.id,
    description: expense.description,
    purchaseDate: expense.date,
    purchaseCost: parseFloat(expense.amountExcludingVAT.toFixed(2)),
    usefulLifeYears: usefulLife,
    annualDepreciation: depreciationForYear,
    depreciationYear: forYear,
    remainingBookValue,
  };
}

/**
 * Geeft alle afschrijvingsregels voor een lijst van uitgaven en een jaar.
 */
export function calculateAllDepreciations(
  expenses: ExpenseEntry[],
  year: number
): DepreciationLine[] {
  const lines: DepreciationLine[] = [];
  for (const exp of expenses) {
    const line = calculateAnnualDepreciation(exp, year);
    if (line) lines.push(line);
  }
  return lines;
}

export function totalDepreciationForYear(
  expenses: ExpenseEntry[],
  year: number
): number {
  return calculateAllDepreciations(expenses, year).reduce(
    (sum, l) => sum + l.annualDepreciation,
    0
  );
}
