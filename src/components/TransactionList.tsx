import React, { useEffect, useState, useCallback } from 'react';
import type { GageEntry, ExpenseEntry } from '../types/gage.types';
import { useApi } from '../hooks/useApi';

// ─── Invoice list ─────────────────────────────────────────────────────────────
export const InvoiceList: React.FC<{ refresh?: number; onEdit?: (entry: GageEntry) => void }> = ({ refresh, onEdit }) => {
  const { data, loading, error, execute } = useApi<GageEntry[]>();
  const deleteApi = useApi<unknown>();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(() => {
    execute('/api/getGageEntries').catch(() => null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [refresh, load]);

  const handleDelete = async (entry: GageEntry) => {
    const label = entry.invoiceNumber || entry.client || entry.description;
    if (!confirm(`Factuur "${label}" verwijderen?`)) return;
    setDeletingId(entry.id);
    await deleteApi.execute(`/api/deleteGageEntry?id=${entry.id}`, { method: 'DELETE' });
    setDeletingId(null);
    load();
  };

  if (loading && !data) return <p className="text-slate-500 text-sm py-4">Laden…</p>;
  if (error)             return <p className="text-red-500 text-sm py-4">Fout: {error}</p>;
  if (!data || data.length === 0) return <p className="text-slate-400 text-sm py-4">Nog geen facturen ingevoerd.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" style={{ minWidth: '700px' }}>
        <thead>
          <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wide">
            <th className="text-left py-2 pr-4 whitespace-nowrap">Fact.nr</th>
            <th className="text-left py-2 pr-4 whitespace-nowrap">Datum</th>
            <th className="text-left py-2 pr-4">Opdrachtgever</th>
            <th className="text-right py-2 pr-4 whitespace-nowrap">Excl. BTW</th>
            <th className="text-right py-2 pr-4 whitespace-nowrap">BTW%</th>
            <th className="text-right py-2 pr-4 whitespace-nowrap">Incl. BTW</th>
            <th className="py-2"></th>
          </tr>
        </thead>
        <tbody>
          {data.map(e => (
            <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="py-2 pr-4 text-slate-500 text-xs font-mono whitespace-nowrap">{e.invoiceNumber ?? '—'}</td>
              <td className="py-2 pr-4 text-slate-600 whitespace-nowrap">{new Date(e.date + 'T12:00:00').toLocaleDateString('nl-NL')}</td>
              <td className="py-2 pr-4 text-slate-800 font-medium">
                {e.client || e.description}
                {e.isForeignIncome && <span className="ml-1 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">🌍 buitenland</span>}
              </td>
              <td className="py-2 pr-4 text-right text-green-700 font-semibold tabular-nums whitespace-nowrap">
                € {e.amount.amountExcludingVAT.toFixed(2)}
              </td>
              <td className="py-2 pr-4 text-right text-slate-500 whitespace-nowrap">
                {e.amount.vatRate === 'performance' ? '9%' : e.amount.vatRate === 'standard' ? '21%' : '0%'}
              </td>
              <td className="py-2 pr-4 text-right text-slate-800 font-semibold tabular-nums whitespace-nowrap">
                € {e.amount.amountIncludingVAT.toFixed(2)}
              </td>
              <td className="py-2 text-right whitespace-nowrap">
                <button onClick={() => onEdit?.(e)}
                  className="text-purple-500 hover:text-purple-700 text-xs px-1.5 py-1 rounded hover:bg-purple-50 mr-0.5">
                  ✏️
                </button>
                <button onClick={() => handleDelete(e)} disabled={deletingId === e.id}
                  className="text-red-400 hover:text-red-600 text-xs px-1.5 py-1 rounded hover:bg-red-50 disabled:opacity-40">
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ─── Expense list ─────────────────────────────────────────────────────────────
export const ExpenseList: React.FC<{ refresh?: number }> = ({ refresh }) => {
  const { data, loading, error, execute } = useApi<ExpenseEntry[]>();

  useEffect(() => {
    execute('/api/getExpenseEntries').catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  if (loading) return <p className="text-slate-500 text-sm py-4">Laden…</p>;
  if (error)   return <p className="text-red-500 text-sm py-4">Fout: {error}</p>;
  if (!data || data.length === 0) return <p className="text-slate-400 text-sm py-4">Nog geen uitgaven ingevoerd.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wide">
            <th className="text-left py-2 pr-4">Datum</th>
            <th className="text-left py-2 pr-4">Omschrijving</th>
            <th className="text-left py-2 pr-4">Categorie</th>
            <th className="text-right py-2 pr-4">Excl. BTW</th>
            <th className="text-right py-2 pr-4">Voorbelasting</th>
            <th className="text-right py-2">Activering</th>
          </tr>
        </thead>
        <tbody>
          {data.map(e => (
            <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="py-2 pr-4 text-slate-600">{new Date(e.date).toLocaleDateString('nl-NL')}</td>
              <td className="py-2 pr-4 text-slate-800 font-medium">{e.description}</td>
              <td className="py-2 pr-4">
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                  {e.category}
                </span>
              </td>
              <td className="py-2 pr-4 text-right text-red-600 font-semibold">
                − € {e.amountExcludingVAT.toFixed(2)}
              </td>
              <td className="py-2 pr-4 text-right text-orange-500 font-semibold">
                € {e.vatAmount.toFixed(2)}
              </td>
              <td className="py-2 text-right">
                {e.isDepreciableAsset ? (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                    Actief ({e.usefulLifeYears}jr)
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">Direct</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
