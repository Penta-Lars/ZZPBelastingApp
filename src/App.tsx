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

export const App: React.FC = () => {
  const [tab, setTab] = useState<AppTab>('facturen');
  // Refresh counter: verhoogd na opslaan zodat lijsten herladen
  const [invoiceRefresh, setInvoiceRefresh] = useState(0);
  const [expenseRefresh, setExpenseRefresh] = useState(0);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation active={tab} onChange={setTab} />

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* ── Facturen ─────────────────────────────────────────────────── */}
        {tab === 'facturen' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <InvoiceForm onSaved={() => setInvoiceRefresh(r => r + 1)} />
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4">📄 Ingevoerde Facturen</h2>
              <InvoiceList refresh={invoiceRefresh} />
            </div>
          </div>
        )}

        {/* ── Bonnetjes ────────────────────────────────────────────────── */}
        {tab === 'bonnetjes' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
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
