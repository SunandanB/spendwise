import React, { useState } from 'react';
import { PolicyProduct } from '../../types/policy';
import { RecommendationService } from '../../services/recommendationService';

interface PolicyDetailsModalProps {
  product: PolicyProduct | null;
  monthlyBudget: number;
  onClose: () => void;
}

export const PolicyDetailsModal: React.FC<PolicyDetailsModalProps> = ({ product, monthlyBudget, onClose }) => {
  if (!product) return null;

  const defaultMonthly = Math.max(product.minInvestment || 500, Math.round((monthlyBudget * 0.2)));
  const [amt, setAmt] = useState<number>(defaultMonthly);
  const [years, setYears] = useState<number>(10);
  const [rate, setRate] = useState<number>(
    product.category === 'Mutual Funds' ? 14.5 :
    product.category === 'ULIPs' ? 12.5 :
    product.category === 'Fixed Income/Savings Plans' ? 6.8 :
    product.category === 'Pension/Retirement' ? 7.5 : 0
  );

  const calc = RecommendationService.calculateProjectedReturns({
    monthlyAmount: amt,
    years: years,
    expectedReturnRate: rate
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 p-6 md:p-8 shadow-2xl space-y-6">
        
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl font-bold w-8 h-8 rounded-full bg-slate-800/60 flex items-center justify-center"
        >
          ✕
        </button>

        {/* Modal Title */}
        <div className="space-y-1">
          <span className="text-xs text-indigo-400 font-semibold">{product.category} — {product.institution}</span>
          <h2 className="text-xl font-bold text-white tracking-tight">{product.name}</h2>
        </div>

        {/* Return Calculator Inputs */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Maturity Return Estimator</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Monthly Contribution (₹)</label>
              <input
                type="number"
                value={amt}
                onChange={(e) => setAmt(Number(e.target.value))}
                min="500"
                step="500"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Tenure (Years)</label>
              <input
                type="number"
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                min="1"
                max="30"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Expected Return (% p.a.)</label>
              <input
                type="number"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                step="0.5"
                disabled={product.category === 'Term Insurance' || product.category === 'Health Insurance'}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white disabled:opacity-50"
              />
            </div>
          </div>

          {/* Results Summary Box */}
          {product.category === 'Term Insurance' || product.category === 'Health Insurance' ? (
            <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/20 text-xs text-slate-300 space-y-1">
              <p><strong>Total Premium Payable over {years} Yrs:</strong> ₹{calc.totalInvested.toLocaleString('en-IN')}</p>
              <p className="text-emerald-400 font-semibold">Benefit: High Sum Insured Life & Medical Emergency Cover.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block">Total Invested</span>
                <span className="font-bold text-slate-200">₹{calc.totalInvested.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Estimated Gain</span>
                <span className="font-bold text-emerald-400">+₹{calc.estimatedWealthGain.toLocaleString('en-IN')}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Projected Maturity</span>
                <span className="font-extrabold text-violet-400">₹{calc.projectedMaturityValue.toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}
        </div>

        {/* Detailed Features */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-300">Detailed Key Features & Benefits:</h4>
          <ul className="text-xs text-slate-300 space-y-1 pl-4 list-disc">
            {product.keyFeatures.map((feat, idx) => (
              <li key={idx}>{feat}</li>
            ))}
          </ul>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition"
          >
            Close Window
          </button>
        </div>

      </div>
    </div>
  );
};
