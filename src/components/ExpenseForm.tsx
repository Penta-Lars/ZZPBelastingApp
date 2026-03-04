import React, { useState, useEffect } from 'react';
import type { SaveExpenseRequest, VATRateType, ExpenseEntry } from '../types/gage.types';
import { IB_CONSTANTS_2025 } from '../types/gage.types';
import { useApi } from '../hooks/useApi';
import { useCategories } from '../hooks/useCategories';

const VAT_RATES: { value: VATRateType; label: string }[] = [
  { value: 'standard',    label: '21% – standaard' },
  { value: 'performance', label: '9% – verlaagd' },
  { value: 'exempt',      label: '0% / Vrijgesteld' },
];

const blank = (): SaveExpenseRequest => ({
  date: new Date().toISOString().split('T')[0],
  description: '',
  category: 'Overig',
  amountIncludingVAT: 0,
  vatRateOnExpense: 'standard',
  isDepreciableAsset: false,
  usefulLifeYears: 5,
});

interface Props {
  onSaved?: () => void;
  editEntry?: ExpenseEntry;
  onCancelEdit?: () => void;
}

export const ExpenseForm: React.FC<Props> = ({ onSaved, editEntry, onCancelEdit }) => {
  const { loading, error, execute } = useApi<unknown>();
  const { allCategories, addCategory } = useCategories();
  const [saved, setSaved] = useState(false);
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [form, setForm] = useState<SaveExpenseRequest>(blank());

  // Vul formulier als we in edit-modus zijn
  useEffect(() => {
    if (editEntry) {
      setForm({
        date: editEntry.date,
        description: editEntry.description,
        category: editEntry.category,
        amountIncludingVAT: editEntry.amountIncludingVAT,
        vatRateOnExpense: editEntry.vatRateOnExpense,
        isDepreciableAsset: editEntry.isDepreciableAsset,
        usefulLifeYears: editEntry.usefulLifeYears ?? 5,
      });
      setSaved(false);
    } else {
      setForm(blank());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editEntry?.id]);

  const vatRate = form.vatRateOnExpense === 'standard' ? 0.21 : form.vatRateOnExpense === 'performance' ? 0.09 : 0;
  const excl    = form.amountIncludingVAT > 0 ? form.amountIncludingVAT / (1 + vatRate) : 0;
  const vatAmt  = form.amountIncludingVAT - excl;
  const mustDepreciate = excl > IB_CONSTANTS_2025.depreciationThreshold;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    const payload: SaveExpenseRequest = {
      ...form,
      isDepreciableAsset: form.isDepreciableAsset || mustDepreciate,
    };

    if (editEntry) {
      await execute('/api/updateExpenseEntry', {
        method: 'PUT',
        body: JSON.stringify({ id: editEntry.id, ...payload }),
      });
    } else {
      await execute('/api/saveExpenseEntry', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }
    setSaved(true);
    if (!editEntry) setForm(blank());
    onSaved?.();
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 max-w-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800">
          {editEntry ? '✏️ Uitgave aanpassen' : '➕ Nieuwe Uitgave / Bonnetje'}
        </h2>
        {editEntry && (
          <button onClick={onCancelEdit}
            className="text-slate-400 hover:text-slate-600 text-sm px-2 py-1 rounded hover:bg-slate-100">
            ✕ Annuleren
          </button>
        )}
      </div>

      {saved && (
        <div className="mb-4 bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm font-medium">
          ✅ {editEntry ? 'Uitgave bijgewerkt!' : 'Uitgave opgeslagen!'}
        </div>
      )}
      {error && (
        <div className="mb-4 bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm font-medium">
          ❌ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Datum */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Datum</label>
          <input type="date" required value={form.date}
            onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        {/* Omschrijving */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Omschrijving</label>
          <input type="text" required placeholder="bijv. Vioolsnaren Thomastik"
            value={form.description}
            onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        {/* Categorie */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Categorie</label>
          <select
            value={showNewCat ? '__new__' : form.category}
            onChange={e => {
              if (e.target.value === '__new__') {
                setShowNewCat(true);
                setNewCatName('');
              } else {
                setShowNewCat(false);
                setForm(prev => ({ ...prev, category: e.target.value }));
              }
            }}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            {allCategories.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
            <option value="__new__">＋ Nieuwe categorie toevoegen…</option>
          </select>

          {showNewCat && (
            <div className="mt-2 flex gap-2">
              <input
                autoFocus
                type="text"
                placeholder="Naam nieuwe categorie"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const ok = addCategory(newCatName);
                    if (ok) {
                      setForm(prev => ({ ...prev, category: newCatName.trim() }));
                      setShowNewCat(false);
                    }
                  }
                  if (e.key === 'Escape') { setShowNewCat(false); }
                }}
                className="flex-1 border border-blue-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="button"
                onClick={() => {
                  const ok = addCategory(newCatName);
                  if (ok) {
                    setForm(prev => ({ ...prev, category: newCatName.trim() }));
                    setShowNewCat(false);
                  }
                }}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg"
              >
                Toevoegen
              </button>
              <button
                type="button"
                onClick={() => setShowNewCat(false)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm rounded-lg"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Bedrag */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Bedrag incl. BTW (€)
          </label>
          <input type="number" required min="0.01" step="0.01" placeholder="0,00"
            value={form.amountIncludingVAT || ''}
            onChange={e => setForm(prev => ({ ...prev, amountIncludingVAT: parseFloat(e.target.value) || 0 }))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        {/* BTW-tarief */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">BTW-tarief op inkoop</label>
          <select value={form.vatRateOnExpense}
            onChange={e => setForm(prev => ({ ...prev, vatRateOnExpense: e.target.value as VATRateType }))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            {VAT_RATES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>

        {/* Afschrijving waarschuwing / toggle */}
        {mustDepreciate && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
            ⚠️ Dit actief kost <strong>€ {excl.toFixed(2)} excl. BTW</strong>, wat boven de drempel van
            €{IB_CONSTANTS_2025.depreciationThreshold} ligt. Het wordt automatisch als investering
            geactiveerd en lineair afgeschreven.
          </div>
        )}

        {(form.isDepreciableAsset || mustDepreciate) && (
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Afschrijvingsduur (jaren, min. 5)
            </label>
            <input type="number" min="5" max="20" step="1"
              value={form.usefulLifeYears ?? 5}
              onChange={e => setForm(prev => ({ ...prev, usefulLifeYears: parseInt(e.target.value) || 5 }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
        )}

        {!mustDepreciate && (
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" checked={form.isDepreciableAsset}
              onChange={e => setForm(prev => ({ ...prev, isDepreciableAsset: e.target.checked }))}
              className="accent-blue-500"
            />
            Handmatig activeren als investering (afschrijven)
          </label>
        )}

        {/* Preview */}
        {form.amountIncludingVAT > 0 && (
          <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-3 gap-3 text-center text-xs">
            <div>
              <p className="text-slate-500 font-semibold uppercase tracking-wide">Excl. BTW</p>
              <p className="text-blue-600 font-bold text-base">€ {excl.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-slate-500 font-semibold uppercase tracking-wide">BTW (voorbelasting)</p>
              <p className="text-orange-500 font-bold text-base">€ {vatAmt.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-slate-500 font-semibold uppercase tracking-wide">Incl. BTW</p>
              <p className="text-slate-800 font-bold text-base">€ {form.amountIncludingVAT.toFixed(2)}</p>
            </div>
          </div>
        )}

        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
        >
          {loading ? 'Opslaan…' : editEntry ? 'Wijzigingen opslaan' : 'Uitgave opslaan'}
        </button>
      </form>
    </div>
  );
};
