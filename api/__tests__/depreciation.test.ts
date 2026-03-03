import {
  isDepreciable,
  calculateAnnualDepreciation,
  calculateAllDepreciations,
} from '../src/utils/depreciationCalculator';
import type { ExpenseEntry } from '../src/types';
import { IB_CONSTANTS_2025 } from '../src/types';

function makeExpense(opts: {
  id?: string;
  amountExcl: number;
  date?: string;
  usefulLife?: number;
  isDepreciable?: boolean;
}): ExpenseEntry {
  return {
    id: opts.id ?? 'e1',
    userId: 'u1',
    date: opts.date ?? '2025-01-01',
    description: 'test instrument',
    category: 'Instrumenten',
    amountIncludingVAT: opts.amountExcl * 1.21,
    amountExcludingVAT: opts.amountExcl,
    vatAmount: opts.amountExcl * 0.21,
    vatRateOnExpense: 'standard',
    isDepreciableAsset: opts.isDepreciable ?? true,
    usefulLifeYears: opts.usefulLife ?? 5,
    createdAt: '', updatedAt: '',
  };
}

describe('depreciationCalculator', () => {
  // ── isDepreciable ──────────────────────────────────────────────────────────
  describe('isDepreciable', () => {
    it('true wanneer excl. BTW > €450 en isDepreciableAsset=true', () => {
      expect(isDepreciable(makeExpense({ amountExcl: 500 }))).toBe(true);
    });

    it(`false wanneer excl. BTW ≤ €${IB_CONSTANTS_2025.depreciationThreshold}`, () => {
      expect(isDepreciable(makeExpense({ amountExcl: 450 }))).toBe(false);
    });

    it('false wanneer isDepreciableAsset=false, ook al is bedrag hoog', () => {
      expect(isDepreciable(makeExpense({ amountExcl: 1000, isDepreciable: false }))).toBe(false);
    });
  });

  // ── calculateAnnualDepreciation ────────────────────────────────────────────
  describe('calculateAnnualDepreciation', () => {
    it('berekent jaarafschrijving voor een vol jaar (niet het aankoopjaar)', () => {
      const exp = makeExpense({ amountExcl: 1000, date: '2024-01-01', usefulLife: 5 });
      const line = calculateAnnualDepreciation(exp, 2025);

      // 1000 / 5 = 200 per jaar
      expect(line).not.toBeNull();
      expect(line!.annualDepreciation).toBe(200);
    });

    it('pro-rata eerste jaar (1 jan → 12 maanden = volledig jaar)', () => {
      const exp = makeExpense({ amountExcl: 1200, date: '2025-01-01', usefulLife: 5 });
      const line = calculateAnnualDepreciation(exp, 2025);

      // Jan = maand 0, dus 12 maanden resterend → vol jaar = 240
      expect(line!.annualDepreciation).toBe(240);
    });

    it('pro-rata eerste jaar: aankoop juli = halfjaar', () => {
      const exp = makeExpense({ amountExcl: 1200, date: '2025-07-01', usefulLife: 5 });
      const line = calculateAnnualDepreciation(exp, 2025);

      // Juli = maand 6, 6 maanden resterend → 240 * 6/12 = 120
      expect(line!.annualDepreciation).toBe(120);
    });

    it('null na het einde van de looptijd', () => {
      const exp = makeExpense({ amountExcl: 1000, date: '2020-01-01', usefulLife: 5 });
      // Looptijd t/m 2024, in 2025 geen afschrijving meer
      expect(calculateAnnualDepreciation(exp, 2025)).toBeNull();
    });

    it('null voor het aankoopjaar', () => {
      const exp = makeExpense({ amountExcl: 1000, date: '2025-01-01', usefulLife: 5 });
      expect(calculateAnnualDepreciation(exp, 2024)).toBeNull();
    });

    it('null voor niet-activeerbare uitgaven', () => {
      const exp = makeExpense({ amountExcl: 1000, isDepreciable: false });
      expect(calculateAnnualDepreciation(exp, 2025)).toBeNull();
    });

    it('restwaarde daalt elk jaar', () => {
      const exp = makeExpense({ amountExcl: 1000, date: '2024-01-01', usefulLife: 5 });
      const yr1 = calculateAnnualDepreciation(exp, 2024)!;
      const yr2 = calculateAnnualDepreciation(exp, 2025)!;

      expect(yr2.remainingBookValue).toBeLessThan(yr1.remainingBookValue);
    });
  });

  // ── calculateAllDepreciations ───────────────────────────────────────────────
  describe('calculateAllDepreciations', () => {
    it('geeft meerdere activa terug voor hetzelfde jaar', () => {
      const expenses = [
        makeExpense({ id: 'e1', amountExcl: 1000, date: '2024-01-01' }),
        makeExpense({ id: 'e2', amountExcl: 2000, date: '2024-01-01' }),
      ];
      const lines = calculateAllDepreciations(expenses, 2025);

      expect(lines.length).toBe(2);
      expect(lines.reduce((s, l) => s + l.annualDepreciation, 0)).toBe(600); // 200 + 400
    });

    it('slaat niet-activeerbare uitgaven over', () => {
      const expenses = [
        makeExpense({ id: 'e1', amountExcl: 1000, isDepreciable: false }),
      ];
      expect(calculateAllDepreciations(expenses, 2025)).toHaveLength(0);
    });
  });
});
