import { calculateIBJaarrapport } from '../src/utils/ibCalculator';
import { IB_CONSTANTS_2025 } from '../src/types';
import type { GageEntry, ExpenseEntry } from '../src/types';

function income(amountExcl: number, vatRate: 'performance' | 'standard' | 'exempt' = 'performance'): GageEntry {
  const vatR = vatRate === 'performance' ? 0.09 : vatRate === 'standard' ? 0.21 : 0;
  const incl = parseFloat((amountExcl * (1 + vatR)).toFixed(2));
  return {
    id: 'i1', userId: 'u1', date: '2025-06-01', description: 'optreden', category: 'Optreden',
    amount: { amountIncludingVAT: incl, amountExcludingVAT: amountExcl, vatAmount: incl - amountExcl, vatRate },
    createdAt: '', updatedAt: '',
  };
}

function expense(amountExcl: number, isDepreciable = false, usefulLifeYears = 5): ExpenseEntry {
  return {
    id: 'e1', userId: 'u1', date: '2025-01-15', description: 'kosten', category: 'Overig',
    amountIncludingVAT: amountExcl * 1.21, amountExcludingVAT: amountExcl,
    vatAmount: amountExcl * 0.21, vatRateOnExpense: 'standard',
    isDepreciableAsset: isDepreciable, usefulLifeYears,
    createdAt: '', updatedAt: '',
  };
}

describe('ibCalculator – calculateIBJaarrapport', () => {
  it('omzet excl. BTW wordt correct gesommeerd', () => {
    const rapport = calculateIBJaarrapport([income(1000), income(500)], [], 2025);
    expect(rapport.omzetExclBTW).toBe(1500);
  });

  it('directe bedrijfskosten direct in winst', () => {
    const rapport = calculateIBJaarrapport([income(1000)], [expense(200)], 2025);
    // winst = 1000 - 200 = 800
    expect(rapport.winst).toBe(800);
  });

  it('investeringskosten worden NIET direct als kosten meegenomen', () => {
    // €600 excl → activeert, alleen afschrijving in jaar 1 (12 mnd → 600/5=120)
    const inv = expense(600, true, 5);
    const rapport = calculateIBJaarrapport([income(1000)], [inv], 2025);

    expect(rapport.bedrijfskosten['Overig']).toBe(0);
    expect(rapport.afschrijvingen).toBeCloseTo(120, 1);
    expect(rapport.winst).toBeCloseTo(880, 1);
  });

  it('zelfstandigenaftrek maximaal gelijk aan de winst (nooit negatief)', () => {
    // winst €100 → zelfst.aftrek max €100, niet €2.470
    const rapport = calculateIBJaarrapport([income(100)], [], 2025);
    expect(rapport.zelfstandigenaftrek).toBe(100);
    expect(rapport.winstNaOndernemersaftrek).toBe(0);
  });

  it('zelfstandigenaftrek = IB_CONSTANTS_2025.zelfstandigenaftrek bij voldoende winst', () => {
    const rapport = calculateIBJaarrapport([income(10000)], [], 2025);
    expect(rapport.zelfstandigenaftrek).toBe(IB_CONSTANTS_2025.zelfstandigenaftrek);
  });

  it('startersaftrek wordt alleen toegepast indien gevraagd', () => {
    const rappNormaal = calculateIBJaarrapport([income(10000)], [], 2025, false);
    const rappStarter = calculateIBJaarrapport([income(10000)], [], 2025, true);

    expect(rappNormaal.startersaftrek).toBe(0);
    expect(rappStarter.startersaftrek).toBe(IB_CONSTANTS_2025.startersaftrek);
    expect(rappStarter.belastbareWinst).toBeLessThan(rappNormaal.belastbareWinst);
  });

  it('MKB-winstvrijstelling = 13,31% van winst na ondernemersaftrek', () => {
    const rapport = calculateIBJaarrapport([income(10000)], [], 2025);
    const verwacht = parseFloat((rapport.winstNaOndernemersaftrek * 0.1331).toFixed(2));
    expect(rapport.mkbWinstvrijstelling).toBeCloseTo(verwacht, 2);
  });

  it('belastbareWinst = winstNaOndernemersaftrek - mkbWinstvrijstelling', () => {
    const rapport = calculateIBJaarrapport([income(10000)], [], 2025);
    const verwacht = parseFloat(
      (rapport.winstNaOndernemersaftrek - rapport.mkbWinstvrijstelling).toFixed(2)
    );
    expect(rapport.belastbareWinst).toBeCloseTo(verwacht, 2);
  });

  it('omzetPerTarief splitst correct naar BTW-tarief', () => {
    const entries = [
      income(1000, 'performance'), // 9%
      income(500, 'standard'),     // 21%
      income(200, 'exempt'),       // 0%
    ];
    const rapport = calculateIBJaarrapport(entries, [], 2025);
    expect(rapport.omzetPerTarief.tarief9pct).toBe(1000);
    expect(rapport.omzetPerTarief.tarief21pct).toBe(500);
    expect(rapport.omzetPerTarief.vrijgesteld).toBe(200);
  });

  it('inkomsten buiten het jaar worden genegeerd', () => {
    const oudeInkomst: GageEntry = {
      id: 'i2', userId: 'u1', date: '2024-12-31', description: 'oud', category: 'Optreden',
      amount: { amountIncludingVAT: 109, amountExcludingVAT: 100, vatAmount: 9, vatRate: 'performance' },
      createdAt: '', updatedAt: '',
    };
    const rapport = calculateIBJaarrapport([oudeInkomst, income(500)], [], 2025);
    expect(rapport.omzetExclBTW).toBe(500);
  });
});
