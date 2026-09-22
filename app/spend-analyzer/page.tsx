'use client';

import React from 'react';
import { Navbar } from '../../components/navigation/Navbar';
import { Sidebar } from '../../components/navigation/Sidebar';
import { QuickActionsCard } from '../../components/navigation/QuickActionsCard';

export default function SpendAnalyzerPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      <Navbar activeTab="spend-analyzer" />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar activeTab="spend-analyzer" />

        <main className="flex-1 p-4 md:p-8 space-y-8 overflow-y-auto">
          
          {/* Hero Banner */}
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              SpendWise — Monthly Spend Analyzer
            </h1>
            <p className="text-sm text-slate-400">
              Upload your statement, analyze category breakdowns, and receive personalized AI investment recommendations.
            </p>
          </div>

          {/* Upload & Dashboard Placeholder Card */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-8 text-center space-y-4 backdrop-blur-xl">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-3xl">
              📂
            </div>
            <h2 className="text-xl font-bold text-white">Bank Statement Upload & Analysis</h2>
            <p className="text-sm text-slate-400 max-w-lg mx-auto">
              Upload your bank statement (.CSV, .XLSX) to view automated category breakdowns, monthly spending graphs, and savings ratios.
            </p>
          </div>

        </main>
      </div>

    </div>
  );
};
