import React from 'react';
import { FinancialProfile } from '../../types/policy';
import { RecommendationService } from '../../services/recommendationService';

interface PolicyOverviewProps {
  profile: FinancialProfile;
  institution: string;
  aiInsightsText: string;
}

export const PolicyOverview: React.FC<PolicyOverviewProps> = ({ profile, institution, aiInsightsText }) => {
  const summary = RecommendationService.getIncomeBudgetSummary(profile);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900 to-indigo-950/40 border border-indigo-500/30 p-6 md:p-8 backdrop-blur-xl shadow-2xl space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/60 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-semibold border border-cyan-500/20 mb-2">
            <span>✨</span> AI Financial Assessment
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Dynamic Recommendations for <span class="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">{institution}</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Monthly Income: <strong className="text-slate-200">₹{profile.monthlyIncome.toLocaleString('en-IN')}</strong> | 
            Investment Budget: <strong className="text-slate-200">₹{profile.monthlyInvestment.toLocaleString('en-IN')}</strong> ({profile.savingsRatePct}% savings rate)
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950/60 px-4 py-2.5 rounded-xl border border-slate-800 text-xs text-slate-300">
          <span>🎯</span>
          <span>Target Horizon: <strong>5 - 20 Yrs</strong></span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Savings-to-Income</span>
          <p className="text-2xl font-extrabold text-white">{summary.savingsRatePct}%</p>
          <span className="text-[11px] text-cyan-400 font-medium">
            {summary.savingsRatePct >= 20 ? 'Healthy Allocation' : 'Conservative Start'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Est. Annual Tax Relief</span>
          <p className="text-2xl font-extrabold text-emerald-400">₹{summary.estimatedAnnualTaxSavings.toLocaleString('en-IN')}</p>
          <span className="text-[11px] text-slate-400">Sec 80C & 80D</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
          <span className="text-xs text-slate-400 font-medium">Recommended Life Cover</span>
          <p className="text-2xl font-extrabold text-indigo-400">₹{(summary.recommendedTermCover / 10000000).toFixed(2)} Cr</p>
          <span className="text-[11px] text-slate-400">20X Annual Income</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
          <span className="text-xs text-slate-400 font-medium">AI Suitability Index</span>
          <p className="text-2xl font-extrabold text-violet-400">{summary.aiSuitabilityIndex} / 100</p>
          <span className="text-[11px] text-emerald-400 font-medium">High Compatibility</span>
        </div>

      </div>

      {/* AI Explanation Box */}
      <div className="p-5 rounded-xl bg-indigo-950/40 border border-indigo-500/20 space-y-2">
        <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          AI Financial Strategy Insights
        </div>
        <div className="text-sm text-slate-300 leading-relaxed space-y-2">
          {aiInsightsText}
        </div>
      </div>

    </div>
  );
};
