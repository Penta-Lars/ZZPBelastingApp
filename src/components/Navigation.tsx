import React from 'react';

export type AppTab = 'facturen' | 'bonnetjes' | 'btw' | 'ib';

interface Props {
  active: AppTab;
  onChange: (tab: AppTab) => void;
}

const TABS: { id: AppTab; label: string; icon: string }[] = [
  { id: 'facturen',  label: 'Facturen',    icon: '📄' },
  { id: 'bonnetjes', label: 'Bonnetjes',   icon: '🧾' },
  { id: 'btw',       label: 'BTW-aangifte',icon: '📊' },
  { id: 'ib',        label: 'IB-aangifte', icon: '🏛️' },
];

export const Navigation: React.FC<Props> = ({ active, onChange }) => (
  <nav className="bg-white border-b border-slate-200 shadow-sm">
    <div className="max-w-5xl mx-auto px-4">
      {/* App title */}
      <div className="flex items-center justify-between py-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">ZZP Belasting App</h1>
          <p className="text-xs text-slate-500">Voor musici in Nederland</p>
        </div>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">
          Aangifteperiode 2025
        </span>
      </div>
      {/* Tabs */}
      <div className="flex gap-1 pb-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-all duration-150 ${
              active === tab.id
                ? 'border-purple-500 text-purple-700 bg-purple-50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  </nav>
);
