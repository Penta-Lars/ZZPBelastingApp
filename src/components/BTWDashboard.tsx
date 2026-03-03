import React, { useEffect, useState } from 'react';
import type { BTWAangifte } from '../types/gage.types';
import { useApi } from '../hooks/useApi';

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'] as const;
const CURRENT_YEAR = new Date().getFullYear();

function EuroRow({ label, amount, highlight, indent = false }: {
  label: string; amount: number; highlight?: 'red' | 'green' | 'blue'; indent?: boolean;
}) {
  const color = highlight === 'red' ? 'text-red-600' : highlight === 'green' ? 'text-green-600' : highlight === 'blue' ? 'text-blue-700' : 'text-slate-700';
  return (
    <tr className="border-b border-slate-100">
      <td className={`py-1.5 text-sm ${indent ? 'pl-6' : 'pl-2'} text-slate-700`}>{label}</td>
      <td className={`py-1.5 text-sm text-right pr-2 font-semibold tabular-nums ${color}`}>
        € {amount.toFixed(2)}
      </td>
    </tr>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{title}</h3>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full">{children}</table>
      </div>
    </div>
  );
}

/**
 * BTW-dashboard – toont exact de Belastingdienst rubrieken zodat afschriften
 * letterlijk overgetypt kunnen worden in de online aangifte.
 */
export const BTWDashboard: React.FC = () => {
  const { data, loading, error, execute } = useApi<BTWAangifte>();
  const [quarter, setQuarter] = useState<typeof QUARTERS[number]>(() => {
    const m = new Date().getMonth() + 1;
    if (m <= 3) return 'Q1';
    if (m <= 6) return 'Q2';
    if (m <= 9) return 'Q3';
    return 'Q4';
  });
  const [year, setYear] = useState(CURRENT_YEAR);

  useEffect(() => {
    execute(`/api/getBTWAangifte?quarter=${quarter}&year=${year}`).catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quarter, year]);

  const d = data;

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      {/* Controls */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex gap-2">
          {QUARTERS.map(q => (
            <button
              key={q}
              onClick={() => setQuarter(q)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                quarter === q ? 'bg-purple-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >{q}</button>
          ))}
        </div>
        <select
          value={year}
          onChange={e => setYear(parseInt(e.target.value))}
          className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
        >
          {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        <div className="ml-auto">
          {loading && <span className="text-xs text-slate-400">Berekenen…</span>}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">❌ {error}</div>
      )}

      {d && (
        <>
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl p-5 mb-6">
            <p className="text-sm opacity-80">BTW-aangifte — {d.quarter} {d.year}</p>
            <div className="flex justify-between items-end mt-2">
              <div>
                <p className="text-xs opacity-70 uppercase tracking-wide">Totale omzet excl. BTW</p>
                <p className="text-3xl font-bold">€ {d.totaleOmzetExclBTW.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-70 uppercase tracking-wide">
                  {d.rubriek5.rubriek5g_teBetalen >= 0 ? '5g  Te betalen' : '5g  Terug te ontvangen'}
                </p>
                <p className={`text-2xl font-bold ${d.rubriek5.rubriek5g_teBetalen >= 0 ? 'text-red-200' : 'text-green-200'}`}>
                  € {Math.abs(d.rubriek5.rubriek5g_teBetalen).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Rubriek 1 */}
          <Section title="Rubriek 1 — Prestaties binnenland">
            <tbody>
              <EuroRow label="1a  Omzet hoog tarief (21%)" amount={d.rubriek1.rubriek1a_omzetHoogTarief} />
              <EuroRow label="1a  BTW hoog tarief (21%)" amount={d.rubriek1.rubriek1a_btwHoogTarief} indent highlight="blue" />
              <EuroRow label="1b  Omzet laag tarief (9%) – optredens" amount={d.rubriek1.rubriek1b_omzetLaagTarief} />
              <EuroRow label="1b  BTW laag tarief (9%)" amount={d.rubriek1.rubriek1b_btwLaagTarief} indent highlight="blue" />
              <EuroRow label="1c  BTW overige tarieven" amount={d.rubriek1.rubriek1c_btwOverig} indent />
              <EuroRow label="1d  Privégebruik" amount={d.rubriek1.rubriek1d_btw} indent />
              <EuroRow label="1e  Leveringen belast met 0% / vrijgesteld" amount={d.rubriek1.rubriek1e_omzetVrijgesteld} />
            </tbody>
          </Section>

          {/* Rubriek 4 */}
          <Section title="Rubriek 4 — Prestaties vanuit het buitenland">
            <tbody>
              <EuroRow label="4a  Omzet buiten EU" amount={d.rubriek4.rubriek4a_omzet} />
              <EuroRow label="4a  BTW buiten EU" amount={d.rubriek4.rubriek4a_btw} indent highlight="blue" />
              <EuroRow label="4b  Omzet binnen EU" amount={d.rubriek4.rubriek4b_omzet} />
              <EuroRow label="4b  BTW binnen EU" amount={d.rubriek4.rubriek4b_btw} indent highlight="blue" />
            </tbody>
          </Section>

          {/* Rubriek 5 */}
          <Section title="Rubriek 5 — Voorbelasting & saldo">
            <tbody>
              <EuroRow label="Totaal verschuldigde BTW (1 + 4)" amount={d.totaalVerschuldigdBTW} highlight="blue" />
              <EuroRow label="5b  Voorbelasting (BTW op inkopen)" amount={d.rubriek5.rubriek5b_voorbelasting} highlight="green" />
              <EuroRow
                label={d.rubriek5.rubriek5g_teBetalen >= 0
                  ? '5g  Te betalen aan Belastingdienst'
                  : '5g  Terug te ontvangen van Belastingdienst'}
                amount={Math.abs(d.rubriek5.rubriek5g_teBetalen)}
                highlight={d.rubriek5.rubriek5g_teBetalen >= 0 ? 'red' : 'green'}
              />
            </tbody>
          </Section>

          <p className="text-xs text-slate-400 text-center mt-4">
            💡 Typ de bedragen hierboven letterlijk over in de online aangifte op mijnbelastingdienst.nl
          </p>
        </>
      )}
    </div>
  );
};
