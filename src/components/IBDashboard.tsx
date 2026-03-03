import React, { useEffect, useState } from 'react';
import type { IBJaarrapport, ExpenseCategory } from '../types/gage.types';
import { IB_CONSTANTS_2025 } from '../types/gage.types';
import { useApi } from '../hooks/useApi';

const CURRENT_YEAR = new Date().getFullYear();

function Row({ label, amount, highlight, bold, indent = false }: {
  label: string; amount: number; highlight?: 'red' | 'green' | 'blue' | 'amber'; bold?: boolean; indent?: boolean;
}) {
  const colors: Record<string, string> = {
    red: 'text-red-600', green: 'text-green-600', blue: 'text-blue-700', amber: 'text-amber-700',
  };
  const color = highlight ? colors[highlight] : 'text-slate-700';
  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className={`py-2 text-sm ${indent ? 'pl-8' : 'pl-3'} ${bold ? 'font-bold' : ''} text-slate-800`}>{label}</td>
      <td className={`py-2 text-sm text-right pr-3 tabular-nums ${color} ${bold ? 'font-bold' : 'font-semibold'}`}>
        € {amount.toFixed(2)}
      </td>
    </tr>
  );
}

function Card({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-5">
      <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center gap-2">
        <span>{icon}</span>
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{title}</h3>
      </div>
      <table className="w-full">{children}</table>
    </div>
  );
}

const EXPENSE_LABELS: Record<ExpenseCategory, string> = {
  Instrumenten: '🎻 Instrumenten',
  Studio: '🎙️ Studio',
  Reiskosten: '🚗 Reiskosten',
  Bladmuziek: '🎼 Bladmuziek',
  Concertkleding: '👔 Concertkleding',
  Vakliteratuur: '📚 Vakliteratuur',
  Marketing: '📣 Marketing',
  Kantoorkosten: '🖥️ Kantoorkosten',
  Overig: '📋 Overig',
};

/**
 * IB-Aangifte Dashboard – Inkomstenbelasting Box 1 – Winst uit onderneming
 * Labels zijn exact de labels van de Belastingdienst IB-aangifte.
 */
export const IBDashboard: React.FC = () => {
  const { data, loading, error, execute } = useApi<IBJaarrapport>();
  const [year, setYear] = useState(CURRENT_YEAR - 1); // standaard vorig jaar (aangifte)
  const [starter, setStarter] = useState(false);

  useEffect(() => {
    execute(`/api/getIBAangifte?year=${year}&starter=${starter}`).catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, starter]);

  const d = data;

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <select
          value={year}
          onChange={e => setYear(parseInt(e.target.value))}
          className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
        >
          {[2023, 2024, 2025].map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
          <input type="checkbox" checked={starter} onChange={e => setStarter(e.target.checked)}
            className="accent-amber-500" />
          Startersjaar (inclusief startersaftrek € {IB_CONSTANTS_2025.startersaftrek.toLocaleString('nl-NL')})
        </label>

        {loading && <span className="ml-auto text-xs text-slate-400">Berekenen…</span>}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">❌ {error}</div>
      )}

      {d && (
        <>
          {/* Header card */}
          <div className="bg-gradient-to-r from-blue-700 to-purple-700 text-white rounded-2xl p-5 mb-6">
            <p className="text-sm opacity-80">Inkomstenbelasting – Box 1 Winst uit onderneming – {d.year}</p>
            <div className="flex justify-between items-end mt-3">
              <div>
                <p className="text-xs opacity-70 uppercase tracking-wide">Totale omzet (excl. BTW)</p>
                <p className="text-3xl font-bold">€ {d.omzetExclBTW.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-70 uppercase tracking-wide">Belastbare winst (Box 1)</p>
                <p className={`text-2xl font-bold ${d.belastbareWinst >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                  € {d.belastbareWinst.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Winst-en-verliesrekening */}
          <Card title="Winst-en-verliesrekening" icon="📊">
            <tbody>
              <Row label="Omzet (excl. BTW)" amount={d.omzetExclBTW} highlight="green" bold />
              <tr><td colSpan={2} className="py-1 pl-3 text-xs text-slate-400 font-semibold uppercase tracking-wide">Bedrijfskosten</td></tr>
              {(Object.keys(d.bedrijfskosten) as ExpenseCategory[])
                .filter(cat => d.bedrijfskosten[cat] > 0)
                .map(cat => (
                  <Row key={cat} label={EXPENSE_LABELS[cat]} amount={d.bedrijfskosten[cat]} highlight="red" indent />
                ))}
              <Row label="Totale bedrijfskosten" amount={d.totaleBedrijfskosten} highlight="red" bold indent={false} />
              <Row label="Afschrijvingen op investeringen" amount={d.afschrijvingen} highlight="red" />
              <Row label="Bedrijfsresultaat (Winst voor aftrekposten)" amount={d.winst} bold />
            </tbody>
          </Card>

          {/* Ondernemersaftrek */}
          <Card title="Ondernemersaftrek (art. 3.76 IB 2001)" icon="⚖️">
            <tbody>
              <Row label="Winst voor aftrekposten" amount={d.winst} />
              <Row label={`Zelfstandigenaftrek (art. 3.76 IB)`} amount={d.zelfstandigenaftrek} highlight="green" indent />
              {d.startersaftrek > 0 && (
                <Row label="Startersaftrek (art. 3.76 lid 3 IB)" amount={d.startersaftrek} highlight="green" indent />
              )}
              <Row label="Winst na ondernemersaftrek" amount={d.winstNaOndernemersaftrek} bold />
              <Row
                label={`MKB-winstvrijstelling (art. 3.79a IB) – ${(IB_CONSTANTS_2025.mkbWinstvrijstellingRate * 100).toFixed(2)}%`}
                amount={d.mkbWinstvrijstelling}
                highlight="green"
                indent
              />
              <Row label="Belastbare winst uit onderneming (Box 1)" amount={d.belastbareWinst} highlight="blue" bold />
            </tbody>
          </Card>

          {/* Afschrijvingsstaat */}
          {d.depreciationLines.length > 0 && (
            <div className="bg-white rounded-xl border border-amber-200 overflow-hidden mb-5">
              <div className="bg-amber-50 px-4 py-2.5 border-b border-amber-200 flex items-center gap-2">
                <span>🏗️</span>
                <h3 className="text-sm font-bold text-amber-700 uppercase tracking-wide">
                  Afschrijvingsstaat {d.year}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-amber-100 text-amber-700 uppercase tracking-wide">
                      <th className="text-left py-2 pl-3 pr-2">Omschrijving</th>
                      <th className="text-right py-2 pr-2">Aanschaf</th>
                      <th className="text-right py-2 pr-2">Jaren</th>
                      <th className="text-right py-2 pr-2">Afschr. {d.year}</th>
                      <th className="text-right py-2 pr-3">Restwaarde</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.depreciationLines.map(line => (
                      <tr key={line.expenseId} className="border-b border-amber-50">
                        <td className="py-1.5 pl-3 pr-2 text-slate-700">{line.description}</td>
                        <td className="py-1.5 pr-2 text-right tabular-nums text-slate-600">€ {line.purchaseCost.toFixed(2)}</td>
                        <td className="py-1.5 pr-2 text-right text-slate-500">{line.usefulLifeYears}j</td>
                        <td className="py-1.5 pr-2 text-right tabular-nums text-red-600 font-semibold">
                          − € {line.annualDepreciation.toFixed(2)}
                        </td>
                        <td className="py-1.5 pr-3 text-right tabular-nums text-slate-600">€ {line.remainingBookValue.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Omzet per BTW-tarief */}
          <Card title="Omzet per BTW-tarief (controle)" icon="📋">
            <tbody>
              <Row label="9% – Optredens (uitvoerend kunstenaar)" amount={d.omzetPerTarief.tarief9pct} />
              <Row label="21% – Les (21+), merchandise, studio" amount={d.omzetPerTarief.tarief21pct} />
              <Row label="0% / Vrijgesteld – Les minderjarigen" amount={d.omzetPerTarief.vrijgesteld} />
            </tbody>
          </Card>

          <p className="text-xs text-slate-400 text-center mt-2">
            💡 De <strong>belastbare winst</strong> vult u in bij de aangifte IB → Box 1 → Winst uit onderneming.
          </p>
        </>
      )}
    </div>
  );
};
