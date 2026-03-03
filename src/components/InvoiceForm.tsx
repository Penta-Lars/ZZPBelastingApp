import React, { useState } from 'react';
import type { SaveGageEntryRequest, IncomeCategory, VATRateType } from '../types/gage.types';
import { useApi } from '../hooks/useApi';

const INCOME_CATEGORIES: { value: IncomeCategory; label: string }[] = [
  { value: 'Optreden',              label: '🎵 Optreden / Gage (9% BTW)' },
  { value: 'LesgeevenMinderjarigen',label: '🎓 Les – minderjarigen (vrijgesteld)' },
  { value: 'LesgevenMeerderjarigen',label: '🎓 Les – 21+ (21% BTW)' },
  { value: 'StudioOpname',          label: '🎙️ Studio-opname (21% BTW)' },
  { value: 'Merchandise',           label: '👕 Merchandise (21% BTW)' },
  { value: 'Overig',                label: '📋 Overig' },
];

const VAT_RATES: { value: VATRateType; label: string }[] = [
  { value: 'performance', label: '9% – Optreden/uitvoerend kunstenaar' },
  { value: 'standard',    label: '21% – Les (21+), merchandise, studio' },
  { value: 'exempt',      label: '0% / Vrijgesteld – Les minderjarigen (<21 jr)' },
];

interface Props {
  onSaved?: () => void;
}

const DEFAULT_VAT_FOR_CATEGORY: Record<IncomeCategory, VATRateType> = {
  Optreden:               'performance',
  LesgeevenMinderjarigen: 'exempt',
  LesgevenMeerderjarigen: 'standard',
  StudioOpname:           'standard',
  Merchandise:            'standard',
  Overig:                 'standard',
};

export const InvoiceForm: React.FC<Props> = ({ onSaved }) => {
  const { loading, error, execute } = useApi<unknown>();
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState<SaveGageEntryRequest>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: 'Optreden',
    amountIncludingVAT: 0,
    vatRate: 'performance',
    isForeignIncome: false,
  });

  const handleCategoryChange = (cat: IncomeCategory) => {
    setForm(prev => ({ ...prev, category: cat, vatRate: DEFAULT_VAT_FOR_CATEGORY[cat] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    await execute('/api/saveGageEntry', {
      method: 'POST',
      body: JSON.stringify(form),
    });
    setSaved(true);
    setForm(prev => ({ ...prev, description: '', amountIncludingVAT: 0 }));
    onSaved?.();
  };

  // Live preview
  const vatRate = form.vatRate === 'performance' ? 0.09 : form.vatRate === 'standard' ? 0.21 : 0;
  const excl = form.amountIncludingVAT > 0 ? form.amountIncludingVAT / (1 + vatRate) : 0;
  const vatAmt = form.amountIncludingVAT - excl;

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 max-w-xl">
      <h2 className="text-lg font-bold text-slate-800 mb-4">➕ Nieuwe Factuur / Inkomst</h2>

      {saved && (
        <div className="mb-4 bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm font-medium">
          ✅ Factuur opgeslagen!
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
          <input
            type="date"
            required
            value={form.date}
            onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </div>

        {/* Omschrijving */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Omschrijving</label>
          <input
            type="text"
            required
            placeholder="bijv. Optreden Jazz Café Amsterdam"
            value={form.description}
            onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </div>

        {/* Categorie */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Categorie</label>
          <select
            value={form.category}
            onChange={e => handleCategoryChange(e.target.value as IncomeCategory)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
          >
            {INCOME_CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Bedrag incl. BTW */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Bedrag incl. BTW (€)
          </label>
          <input
            type="number"
            required
            min="0.01"
            step="0.01"
            placeholder="0,00"
            value={form.amountIncludingVAT || ''}
            onChange={e => setForm(prev => ({ ...prev, amountIncludingVAT: parseFloat(e.target.value) || 0 }))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </div>

        {/* BTW-tarief */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">BTW-tarief</label>
          <select
            value={form.vatRate}
            onChange={e => setForm(prev => ({ ...prev, vatRate: e.target.value as VATRateType }))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
          >
            {VAT_RATES.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        {/* Buitenland toggle */}
        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={!!form.isForeignIncome}
            onChange={e => setForm(prev => ({ ...prev, isForeignIncome: e.target.checked }))}
            className="accent-purple-500"
          />
          Buitenlandse opdrachtgever (Rubriek 4 BTW-aangifte)
        </label>

        {/* Live preview */}
        {form.amountIncludingVAT > 0 && (
          <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-3 gap-3 text-center text-xs">
            <div>
              <p className="text-slate-500 font-semibold uppercase tracking-wide">Excl. BTW</p>
              <p className="text-green-600 font-bold text-base">€ {excl.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-slate-500 font-semibold uppercase tracking-wide">BTW</p>
              <p className="text-orange-500 font-bold text-base">€ {vatAmt.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-slate-500 font-semibold uppercase tracking-wide">Incl. BTW</p>
              <p className="text-slate-800 font-bold text-base">€ {form.amountIncludingVAT.toFixed(2)}</p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
        >
          {loading ? 'Opslaan…' : 'Factuur opslaan'}
        </button>
      </form>
    </div>
  );
};
