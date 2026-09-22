import React from 'react';

interface QuickActionsCardProps {
  onNavigateToPolicy?: () => void;
}

export const QuickActionsCard: React.FC<QuickActionsCardProps> = ({ onNavigateToPolicy }) => {
  const handleClick = () => {
    if (onNavigateToPolicy) {
      onNavigateToPolicy();
    } else if (typeof window !== 'undefined') {
      window.location.href = '/ai-policy-recommendation';
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950/80 via-slate-900/90 to-slate-950 p-6 border border-indigo-500/30 shadow-xl group hover:border-indigo-400/50 transition-all">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/20 transition-all" />
      
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
            <span>✨</span> Next-Gen AI Feature
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">
            Discover Tailored Policies for Your Preferred Financial Company
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Enter your monthly income, budget, and any financial institution (*Axis Bank, HDFC, SBI, Hostplus, etc.*). Our AI dynamically finds matching insurance, mutual fund, and wealth products.
          </p>
        </div>

        <button
          onClick={handleClick}
          className="whitespace-nowrap px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
        >
          <span>🛡️</span> Launch AI Policy Finder
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </div>
  );
};
