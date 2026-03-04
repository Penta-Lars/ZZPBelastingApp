import React, { useState, useEffect } from 'react';
import type { SaveGageEntryRequest, GageEntry, IncomeCategory, VATRateType } from '../types/gage.types';
import { useApi } from '../hooks/useApi';

const INCOME_CATEGORIES: { value: IncomeCategory; label: string }[] = [
  { value: 'Optreden',               label: '🎵 Optreden / Gage (9% BTW)' },
  { value: 'LesgeevenMinderjarigen', label: '🎓 Les – minderjarigen (vrijgesteld)' },
  { value: 'LesgevenMeerderjarigen', label: '🎓 Les – 21+ (21% BTW)' },
  { value: 'StudioOpname',           label: '🎙️ Studio-opname (21% BTW)' },
  { value: 'Merchandise',            label: '👕 Merchandise (21% BTW)' },
  { value: 'Overig',                 label: '📋 Overig' },
];

const DEFAULT_VAT_FOR_CATEGORY: Record<IncomeCategory, VATRateType> = {
  Optreden:               'performance',
  LesgeevenMinderjarigen: 'exempt',
  LesgevenMeerderjarigen: 'standard',
  StudioOpname:           'standard',
  Merchandise:            'standard',
  Overig:                 'standard',
};

interface FormState extends SaveGageEntryRequest {
  invoiceNumber: string;
  client: string;
}

interface Props {
  onSaved?: () => void;
  editEntry?: GageEntry;
  onCancelEdit?: () => void;
}

export const InvoiceForm: React.FC<Props> = ({ onSaved, editEntry, onCancelEdit }) => {
  const isEdit = !!editEntry;
  const saveApi   = useApi<unknown>();
  const updateApi = useApi<unknown>();
  const { loading, error, execute } = isEdit ? updateApi : saveApi;
  const [saved, setSaved] = useState(false);

  const blankForm = (): FormState => ({
    date: new Date().toISOString().split('T')[0],
    invoiceNumber: '',
    client: '',
    description: '',
    category: 'Optreden',
    amountIncludingVAT: 0,
    vatRate: 'performance',
    isForeignIncome: false,
  });

  const [form, setForm] = useState<FormState>(blankForm);

  useEffect(() => {
    if (editEntry) {
      setForm({
        date: editEntry.date,
        invoiceNumber: editEntry.invoiceNumber ?? '',
        client: editEntry.client ?? editEntry.description ?? '',
        description: editEntry.description ?? '',
        category: editEntry.category,
        amountIncludingVAT: editEntry.amount.amountIncludingVAT,
        vatRate: editEntry.amount.vatRate,
        isForeignIncome: editEntry.isForeignIncome ?? false,
      });
    } else {
      setForm(blankForm());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editEntry?.id]);

  const handleCategoryChange = (cat: IncomeCategory) => {
    setForm(prev => ({ ...prev, category: cat, vatRate: DEFAULT_VAT_FOR_CATEGORY[cat] }));
  };

  const vatMulti = form.vatRate === 'performance' ? 0.09 : form.vatRate === 'standard' ? 0.21 : 0;
  const exclBTW  = form.amountIncludingVAT > 0 ? form.amountIncludingVAT / (1 + vatMulti) : 0;
  const vatAmt   = form.amountIncludingVAT - exclBTW;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    const payload = { ...form, description: form.client || form.description };
    if (isEdit && editEntry) {
      await execute('/api/updateGageEntry', { method: 'PUT', body: JSON.stringify({ id: editEntry.id, ...payload }) });
    } else {
      await execute('/api/saveGageEntry', { method: 'POST', body: JSON.stringify(payload) });
    }
    setSaved(true);
    if (!isEdit) setForm(blankForm());
    onSaved?.();
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 max-w-xl">
      <h2 className="text-lg font-bold text-slate-800 mb-4">
        {isEdit ? '✏️ Factuur aanpassen' : '➕ Nieuwe Factuur / Inkomst'}
      </h2>

      {saved && !isEdit && (
        <div className="mb-4 bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm font-medium">✅ Factuur opgeslagen!</div>
      )}
      {error && (
        <div className="mb-4 bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm font-medium">❌ {error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Factuurnummer</label>
            <input type="text" placeholder="bijv. 2025.01AE" value={form.invoiceNumber}
              onChange={e => setForm(prev => ({ ...prev, invoiceNumber: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Datum</label>
            <input type="date" required value={form.date}
              onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Opdrachtgever</label>
          <input type="text" required placeholder="bijv. Concertgebouw Amsterdam" value={form.client}
            onChange={e => setForm(prev => ({ ...prev, client: e.target.value }))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Categorie</label>
          <select value={form.category} onChange={e => handleCategoryChange(e.target.value as IncomeCategory)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
            {INCOME_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Bedrag excl. BTW (€)</label>
          <input type="number" required min="0.01" step="0.01" placeholder="0,00"
            value={exclBTW > 0 ? parseFloat(exclBTW.toFixed(2)) : ''}
            onChange={e => {
              const v = parseFloat(e.target.value) || 0;
              setForm(prev => ({ ...prev, amountIncludingVAT: parseFloat((v * (1 + vatMulti)).toFixed(2)) }));
            }}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">BTW-tarief</label>
          <select value={form.vatRate} onChange={e => setForm(prev => ({ ...prev, vatRate: e.target.value as VATRateType }))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
            <option value="performance">9% – Optreden/uitvoerend kunstenaar</option>
            <option value="standard">21% – Les (21+), merchandise, studio</option>
            <option value="exempt">0% / Vrijgesteld – buitenland of les minderjarigen</option>
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
          <input type="checkbox" checked={!!form.isForeignIncome}
            onChange={e => setForm(prev => ({ ...prev, isForeignIncome: e.target.checked }))}
            className="accent-purple-500" />
          Buitenlandse opdrachtgever (Rubriek 4 BTW-aangifte)
        </label>

        {form.amountIncludingVAT > 0 && (
          <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-3 gap-3 text-center text-xs">
            <div>
              <p className="text-slate-500 font-semibold uppercase tracking-wide">Excl. BTW</p>
              <p className="text-green-600 font-bold text-base">€ {exclBTW.toFixed(2)}</p>
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

        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors">
            {loading ? 'Opslaan…' : isEdit ? 'Aanpassingen opslaan' : 'Factuur opslaan'}
          </button>
          {isEdit && (
            <button type="button" onClick={onCancelEdit}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors">
              Annuleren
            </button>
          )}
        </div>
      </form>
    </div>
  );
};