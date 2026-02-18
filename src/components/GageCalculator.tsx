import React, { useState, useMemo } from 'react';

type VATRate = 'standard' | 'performance';

interface GageCalculatorState {
  amountIncludingVAT: string;
  vatRate: VATRate;
}

export const GageCalculator: React.FC = () => {
  const [state, setState] = useState<GageCalculatorState>({
    amountIncludingVAT: '',
    vatRate: 'performance', // Default to 9% for performances
  });

  // VAT percentages according to sector rules
  const vatPercentages = {
    performance: 0.09, // 9% for performances/gigs
    standard: 0.21,   // 21% for other services
  };

  // Calculate exclusiveAmount and VAT amount
  const calculations = useMemo(() => {
    const amount = parseFloat(state.amountIncludingVAT);
    
    if (isNaN(amount) || amount <= 0) {
      return {
        amountExcludingVAT: 0,
        vatAmount: 0,
        amountIncludingVAT: 0,
      };
    }

    const vatRate = vatPercentages[state.vatRate];
    const amountExcludingVAT = amount / (1 + vatRate);
    const vatAmount = amount - amountExcludingVAT;

    return {
      amountExcludingVAT: parseFloat(amountExcludingVAT.toFixed(2)),
      vatAmount: parseFloat(vatAmount.toFixed(2)),
      amountIncludingVAT: amount,
    };
  }, [state.amountIncludingVAT, state.vatRate]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState(prev => ({
      ...prev,
      amountIncludingVAT: e.target.value,
    }));
  };

  const handleVATRateChange = (newRate: VATRate) => {
    setState(prev => ({
      ...prev,
      vatRate: newRate,
    }));
  };

  const currentVATPercentage = vatPercentages[state.vatRate] * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Gage Calculator
          </h1>
          <p className="text-slate-600 text-lg">
            Bereken je honorarium snel en accuraat
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
          {/* VAT Rate Selection */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-4">
              Type Optreden / Dienst
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleVATRateChange('performance')}
                className={`py-3 px-4 rounded-lg font-semibold transition-all duration-200 border-2 ${
                  state.vatRate === 'performance'
                    ? 'bg-purple-500 border-purple-500 text-white shadow-lg'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-purple-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xl">🎸</span>
                  <span>Optreden (9% BTW)</span>
                </div>
              </button>
              <button
                onClick={() => handleVATRateChange('standard')}
                className={`py-3 px-4 rounded-lg font-semibold transition-all duration-200 border-2 ${
                  state.vatRate === 'standard'
                    ? 'bg-blue-500 border-blue-500 text-white shadow-lg'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xl">📋</span>
                  <span>Overige Diensten (21%)</span>
                </div>
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label htmlFor="amount" className="block text-sm font-semibold text-slate-700 mb-2">
              Bedrag Inclusief BTW
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 text-lg font-semibold">
                €
              </span>
              <input
                id="amount"
                type="number"
                value={state.amountIncludingVAT}
                onChange={handleAmountChange}
                placeholder="0,00"
                step="0.01"
                min="0"
                className="w-full pl-8 pr-4 py-3 text-lg border-2 border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-colors"
              />
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wide">
              Berekening
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Excluding VAT */}
              <div className="bg-white rounded-lg p-5 border-l-4 border-green-500">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                  Exclusief BTW
                </p>
                <p className="text-2xl font-bold text-green-600">
                  € {calculations.amountExcludingVAT.toFixed(2)}
                </p>
              </div>

              {/* VAT Amount */}
              <div className="bg-white rounded-lg p-5 border-l-4 border-orange-500">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                  BTW ({currentVATPercentage.toFixed(0)}%)
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  € {calculations.vatAmount.toFixed(2)}
                </p>
              </div>

              {/* Including VAT (Summary) */}
              <div className="bg-white rounded-lg p-5 border-l-4 border-purple-500">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
                  Inclusief BTW
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  € {calculations.amountIncludingVAT.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Save as Draft Button */}
          <button
            className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            aria-label="Opslaan als Concept"
          >
            <span className="text-lg">💾</span>
            <span>Opslaan als Concept</span>
          </button>

          {/* Info Text */}
          <div className="text-xs text-slate-500 text-center">
            <p>
              Deze berekening volgt de Nederlandse BTW-regels voor ZZP muzici.{' '}
              <span className="font-semibold">9% BTW</span> voor optreden/gage,{' '}
              <span className="font-semibold">21% BTW</span> voor overige diensten.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
