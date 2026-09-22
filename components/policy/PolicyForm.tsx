import React, { useState } from 'react';
import { RecommendationRequest } from '../../types/policy';

interface PolicyFormProps {
  onSubmit: (req: RecommendationRequest) => void;
  isLoading: boolean;
}

export const PolicyForm: React.FC<PolicyFormProps> = ({ onSubmit, isLoading }) => {
  const [monthlyIncome, setMonthlyIncome] = useState<number | ''>(80000);
  const [investmentAmount, setInvestmentAmount] = useState<number | ''>(10000);
  const [companyName, setCompanyName] = useState<string>('Axis Bank');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [provider, setProvider] = useState<'gemini' | 'openai' | 'free_llm'>('free_llm');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!monthlyIncome || Number(monthlyIncome) <= 0) {
      alert('Please enter a valid monthly income.');
      return;
    }
    if (!investmentAmount || Number(investmentAmount) <= 0) {
      alert('Please enter a valid monthly investment budget.');
      return;
    }
    if (!companyName.trim()) {
      alert('Please enter a financial company name.');
      return;
    }

    onSubmit({
      monthlyIncome: Number(monthlyIncome),
      investmentAmount: Number(investmentAmount),
      companyName: companyName.trim(),
      apiKey: apiKey.trim() || undefined,
      provider
    });
  };

  const setIncomePreset = (val: number) => {
    setMonthlyIncome(val);
  };

  const setInvestPct = (pct: number) => {
    if (typeof monthlyIncome === 'number' && monthlyIncome > 0) {
      setInvestmentAmount(Math.round((monthlyIncome * pct) / 100));
    }
  };

  return (
    <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center text-cyan-400 text-xl font-bold">
          🏢
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Financial Profile & Company Discovery</h2>
          <p className="text-sm text-slate-400">Specify your parameters to run real-time AI product discovery.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Monthly Income */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-200 flex justify-between">
              <span>Monthly Income (₹) <span className="text-pink-500">*</span></span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-slate-400 font-semibold">₹</span>
              <input
                type="number"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value ? Number(e.target.value) : '')}
                placeholder="e.g. 80000"
                min="1000"
                step="1000"
                required
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 pl-9 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
              />
            </div>
            <div className="flex items-center gap-1.5 pt-1 text-xs text-slate-400 flex-wrap">
              <span className="text-slate-500">Quick:</span>
              <button type="button" onClick={() => setIncomePreset(50000)} className="px-2 py-0.5 rounded bg-slate-800 hover:bg-indigo-600/30 hover:text-white transition">₹50k</button>
              <button type="button" onClick={() => setIncomePreset(80000)} className="px-2 py-0.5 rounded bg-slate-800 hover:bg-indigo-600/30 hover:text-white transition">₹80k</button>
              <button type="button" onClick={() => setIncomePreset(120000)} className="px-2 py-0.5 rounded bg-slate-800 hover:bg-indigo-600/30 hover:text-white transition">₹1.2L</button>
              <button type="button" onClick={() => setIncomePreset(200000)} className="px-2 py-0.5 rounded bg-slate-800 hover:bg-indigo-600/30 hover:text-white transition">₹2L</button>
            </div>
          </div>

          {/* Investment Amount */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-200">
              Monthly Investment Amount (₹) <span className="text-pink-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-slate-400 font-semibold">₹</span>
              <input
                type="number"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(e.target.value ? Number(e.target.value) : '')}
                placeholder="e.g. 10000"
                min="500"
                step="500"
                required
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 pl-9 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
              />
            </div>
            <div className="flex items-center gap-1.5 pt-1 text-xs text-slate-400 flex-wrap">
              <span className="text-slate-500">Quick %:</span>
              <button type="button" onClick={() => setInvestPct(10)} className="px-2 py-0.5 rounded bg-slate-800 hover:bg-indigo-600/30 hover:text-white transition">10%</button>
              <button type="button" onClick={() => setInvestPct(15)} className="px-2 py-0.5 rounded bg-slate-800 hover:bg-indigo-600/30 hover:text-white transition">15%</button>
              <button type="button" onClick={() => setInvestPct(20)} className="px-2 py-0.5 rounded bg-slate-800 hover:bg-indigo-600/30 hover:text-white transition">20%</button>
              <button type="button" onClick={() => setInvestPct(30)} className="px-2 py-0.5 rounded bg-slate-800 hover:bg-indigo-600/30 hover:text-white transition">30%</button>
            </div>
          </div>

          {/* Financial Institution Name */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-semibold text-slate-200">
              Financial Institution Name <span class="text-pink-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-slate-400">🏛️</span>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Axis Bank, HDFC Life, ICICI Prudential, Hostplus, Vanguard..."
                required
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 pl-9 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all font-medium"
              />
            </div>
            
            <div className="flex items-center gap-2 pt-1.5 flex-wrap">
              <span className="text-xs text-slate-500">Example Institutions:</span>
              {['Axis Bank', 'HDFC Life', 'ICICI Prudential', 'SBI Life', 'TATA AIA', 'Hostplus', 'Vanguard'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCompanyName(c)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                    companyName === c
                      ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Optional Settings Accordion */}
        <div className="pt-2 border-t border-slate-800/60">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-slate-400 hover:text-indigo-400 flex items-center gap-1.5 transition"
          >
            <span>⚙️ Optional API Key & LLM Provider</span>
            <span>{showAdvanced ? '▲' : '▼'}</span>
          </button>

          {showAdvanced && (
            <div className="mt-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-300 mb-1 block">Provider</label>
                  <select
                    value={provider}
                    onChange={(e: any) => setProvider(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                  >
                    <option value="free_llm">High-Speed AI Discovery Engine (Free Built-in)</option>
                    <option value="gemini">Google Gemini API (Key Required)</option>
                    <option value="openai">OpenAI API (Key Required)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-300 mb-1 block">API Key (Optional)</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter API key or leave empty for free AI engine"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>AI Searching Institution Portfolio...</span>
            </>
          ) : (
            <>
              <span>🛡️ Discover Products & AI Recommendations</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
