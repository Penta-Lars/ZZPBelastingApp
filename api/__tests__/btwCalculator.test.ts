import { calculateBTWAangifte } from '../src/utils/btwCalculator';
import type { GageEntry, ExpenseEntry } from '../src/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function makeIncome(opts: {
  date: string;
  amountIncl: number;
  vatRate: 'performance' | 'standard' | 'exempt';
  foreign?: boolean;
}): GageEntry {
  const rate = opts.vatRate === 'performance' ? 0.09 : opts.vatRate === 'standard' ? 0.21 : 0;
  const excl = rate > 0 ? opts.amountIncl / (1 + rate) : opts.amountIncl;
  return {
    id: 'i1',
    userId: 'u1',
    date: opts.date,
    description: 'test',
    category: 'Optreden',
    isForeignIncome: opts.foreign ?? false,
    amount: {
      amountIncludingVAT: opts.amountIncl,
      amountExcludingVAT: parseFloat(excl.toFixed(2)),
      vatAmount: parseFloat((opts.amountIncl - excl).toFixed(2)),
      vatRate: opts.vatRate,
    },
    createdAt: '', updatedAt: '',
  };
}

function makeExpense(vatAmount: number): ExpenseEntry {
  return {
    id: 'e1', userId: 'u1', date: '2025-01-15',
    description: 'test', category: 'Instrumenten',
    amountIncludingVAT: 121, amountExcludingVAT: 100,
    vatAmount, vatRateOnExpense: 'standard',
    isDepreciableAsset: false,
    createdAt: '', updatedAt: '',
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('btwCalculator – calculateBTWAangifte', () => {
  const Q = 'Q1';
  const YEAR = 2025;

  it('1b – 9% optreden: omzet en BTW correct gesplitst', () => {
    // €109 incl. 9% → excl ≈ 100, BTW ≈ 9
    const entries = [makeIncome({ date: '2025-02-01', amountIncl: 109, vatRate: 'performance' })];
    const result = calculateBTWAangifte(entries, [], Q, YEAR);

    expect(result.rubriek1.rubriek1b_omzetLaagTarief).toBeCloseTo(100, 1);
    expect(result.rubriek1.rubriek1b_btwLaagTarief).toBeCloseTo(9, 1);
    expect(result.rubriek1.rubriek1a_omzetHoogTarief).toBe(0);
  });

  it('1a – 21% merchandise: omzet en BTW correct', () => {
    const entries = [makeIncome({ date: '2025-03-01', amountIncl: 121, vatRate: 'standard' })];
    const result = calculateBTWAangifte(entries, [], Q, YEAR);

    expect(result.rubriek1.rubriek1a_omzetHoogTarief).toBeCloseTo(100, 1);
    expect(result.rubriek1.rubriek1a_btwHoogTarief).toBeCloseTo(21, 1);
    expect(result.rubriek1.rubriek1b_omzetLaagTarief).toBe(0);
  });

  it('1e – vrijgesteld (les minderjarigen): geen BTW, wel omzet', () => {
    const entries = [makeIncome({ date: '2025-01-10', amountIncl: 50, vatRate: 'exempt' })];
    const result = calculateBTWAangifte(entries, [], Q, YEAR);

    expect(result.rubriek1.rubriek1e_omzetVrijgesteld).toBe(50);
    expect(result.totaalVerschuldigdBTW).toBe(0);
  });

  it('4b – buitenlandse gage gaat naar Rubriek 4, NIET naar Rubriek 1', () => {
    const entries = [makeIncome({ date: '2025-02-15', amountIncl: 109, vatRate: 'performance', foreign: true })];
    const result = calculateBTWAangifte(entries, [], Q, YEAR);

    expect(result.rubriek4.rubriek4b_omzet).toBeCloseTo(100, 1);
    expect(result.rubriek1.rubriek1b_omzetLaagTarief).toBe(0);
  });

  it('5b – voorbelasting van inkopen correct afgetrokken', () => {
    const income = [makeIncome({ date: '2025-01-01', amountIncl: 121, vatRate: 'standard' })];
    const expenses = [makeExpense(21)]; // €21 voorbelasting
    const result = calculateBTWAangifte(income, expenses, Q, YEAR);

    expect(result.rubriek5.rubriek5b_voorbelasting).toBe(21);
    // 21 BTW verschuldigd - 21 voorbelasting = 0
    expect(result.rubriek5.rubriek5g_teBetalen).toBeCloseTo(0, 1);
  });

  it('5g – negatief (terug te ontvangen) wanneer voorbelasting > verschuldigd', () => {
    const expenses = [makeExpense(50)];
    const result = calculateBTWAangifte([], expenses, Q, YEAR);

    expect(result.rubriek5.rubriek5g_teBetalen).toBe(-50);
  });

  it('entries buiten het kwartaal worden genegeerd', () => {
    const entries = [makeIncome({ date: '2025-04-01', amountIncl: 109, vatRate: 'performance' })]; // Q2
    const result = calculateBTWAangifte(entries, [], Q, YEAR);

    expect(result.totaleOmzetExclBTW).toBe(0);
  });

  it('totaleOmzetExclBTW = som van alle rubrieken', () => {
    const entries = [
      makeIncome({ date: '2025-01-01', amountIncl: 109,  vatRate: 'performance' }),
      makeIncome({ date: '2025-02-01', amountIncl: 121,  vatRate: 'standard' }),
      makeIncome({ date: '2025-03-01', amountIncl: 50,   vatRate: 'exempt' }),
    ];
    const result = calculateBTWAangifte(entries, [], Q, YEAR);

    const verwacht =
      result.rubriek1.rubriek1a_omzetHoogTarief +
      result.rubriek1.rubriek1b_omzetLaagTarief +
      result.rubriek1.rubriek1e_omzetVrijgesteld;

    expect(result.totaleOmzetExclBTW).toBeCloseTo(verwacht, 2);
  });
});
