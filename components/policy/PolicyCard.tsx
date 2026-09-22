import React, { useState } from 'react';
import { PolicyProduct } from '../../types/policy';

interface PolicyCardProps {
  key?: string | number;
  product: PolicyProduct;
  monthlyBudget: number;
  onOpenDetails: (product: PolicyProduct) => void;
}

export const PolicyCard: React.FC<PolicyCardProps> = ({ product, monthlyBudget, onOpenDetails }) => {
  const [expanded, setExpanded] = useState(false);

  const suggestedMonthly = Math.max(
    product.minInvestment || 500,
    Math.round((monthlyBudget * (product.recommendedBudgetPct || 20)) / 100)
  );

  // Badge color assignment based on category
  const getBadgeStyle = (cat: string) => {
    switch (cat) {
      case 'Term Insurance': return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
      case 'Health Insurance': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Mutual Funds': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'ULIPs': return 'bg-violet-500/20 text-violet-400 border-violet-500/30';
      case 'Fixed Income/Savings Plans': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'Pension/Retirement': return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
      default: return 'bg-slate-700/30 text-slate-300 border-slate-600/30';
    }
  };

  return (
    <div className="group rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 p-6 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all flex flex-col justify-between space-y-4">
      
      {/* Card Top Header */}
      <div className="space-y-3">
        
        <div className="flex justify-between items-start gap-2">
          <div className="flex flex-col gap-1">
            <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border w-fit ${getBadgeStyle(product.category)}`}>
              {product.icon || '🛡️'} {product.category}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Issued by <strong className="text-slate-200">{product.institution}</strong>
            </span>
          </div>

          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px] font-semibold text-slate-300">
            {product.riskLevel} (Score: {product.riskScore})
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-white tracking-tight leading-snug group-hover:text-cyan-300 transition">
          {product.name}
        </h3>

        {/* Summary */}
        <p className="text-xs text-slate-300 leading-relaxed">
          {product.summary}
        </p>

        {/* AI Simple Explanation Box */}
        <div className="p-3 rounded-xl bg-slate-950/80 border-l-2 border-cyan-400 space-y-1">
          <span className="text-[11px] font-bold text-cyan-400 block">💡 AI Simple Explanation</span>
          <p className="text-xs text-slate-200 leading-relaxed">
            {product.simpleExplanation}
          </p>
        </div>

        {/* Metrics Strip */}
        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs">
          <div>
            <span className="text-[10px] text-slate-500 block">Suggested Monthly</span>
            <span className="font-bold text-emerald-400">₹{suggestedMonthly.toLocaleString('en-IN')}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block">Payout Benefit</span>
            <span className="font-bold text-slate-200 truncate block">{product.returns}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block">Tax Exemption</span>
            <span className="font-bold text-violet-400 truncate block">{product.taxBenefit}</span>
          </div>
        </div>

        {/* Key Features (Expandable) */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Key Features & Rationale</span>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-[11px] text-indigo-400 hover:underline"
            >
              {expanded ? 'Hide Features ▲' : 'Show Features ▼'}
            </button>
          </div>

          {expanded && (
            <ul className="text-xs text-slate-300 space-y-1 pl-4 list-disc pt-1 border-t border-slate-800/60">
              {product.keyFeatures.map((feat, i) => (
                <li key={i}>{feat}</li>
              ))}
              <li className="pt-1 text-slate-400 italic list-none">
                <strong>AI Rationale:</strong> {product.recommendationRationale}
              </li>
            </ul>
          )}
        </div>

      </div>

      {/* Card Footer */}
      <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between">
        <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
          <span>✨</span> Fit Score: {product.matchScore || 95}%
        </div>

        <button
          onClick={() => onOpenDetails(product)}
          className="px-3.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold transition-all"
        >
          Calculate Returns & Details
        </button>
      </div>

    </div>
  );
};
