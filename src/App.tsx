import React, { useState } from 'react';
import {
  Navigation,
  InvoiceForm,
  InvoiceList,
  ExpenseForm,
  ExpenseList,
  BTWDashboard,
  IBDashboard,
} from './components';
import type { AppTab } from './components';
import type { GageEntry } from './types/gage.types';

export const App: React.FC = () => {
  const [tab, setTab] = useState<AppTab>('facturen');
  const [invoiceRefresh, setInvoiceRefresh] = useState(0);
  const [expenseRefresh, setExpenseRefresh] = useState(0);
  const [editEntry, setEditEntry] = useState<GageEntry | undefined>();

  const handleInvoiceSaved = () => {
    setInvoiceRefresh(r => r + 1);
    setEditEntry(undefined);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation active={tab} onChange={setTab} />

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* ── Facturen ─────────────────────────────────────────────────── */}
        {tab === 'facturen' && (
          <div className="flex flex-col gap-8">
            <InvoiceForm
              onSaved={handleInvoiceSaved}
              editEntry={editEntry}
              onCancelEdit={() => setEditEntry(undefined)}
            />
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4">📄 Ingevoerde Facturen</h2>
              <InvoiceList refresh={invoiceRefresh} onEdit={entry => { setEditEntry(entry); }} />
            </div>
          </div>
        )}

        {/* ── Bonnetjes ────────────────────────────────────────────────── */}
        {tab === 'bonnetjes' && (
          <div className="flex flex-col gap-8">
            <ExpenseForm onSaved={() => setExpenseRefresh(r => r + 1)} />
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4">🧾 Ingevoerde Uitgaven</h2>
              <ExpenseList refresh={expenseRefresh} />
            </div>
          </div>
        )}

        {/* ── BTW-aangifte ──────────────────────────────────────────────── */}
        {tab === 'btw' && <BTWDashboard />}

        {/* ── IB-aangifte ───────────────────────────────────────────────── */}
        {tab === 'ib' && <IBDashboard />}
      </main>
    </div>
  );
};

export default App;
