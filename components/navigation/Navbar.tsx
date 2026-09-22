import React from 'react';

interface NavbarProps {
  activeTab: 'spend-analyzer' | 'ai-policy-recommendation';
  onNavigate?: (tab: 'spend-analyzer' | 'ai-policy-recommendation') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onNavigate }) => {
  const handleNav = (tab: 'spend-analyzer' | 'ai-policy-recommendation', url: string) => {
    if (onNavigate) {
      onNavigate(tab);
    } else if (typeof window !== 'undefined') {
      window.location.href = url;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/60 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Brand Logo */}
        <div
          onClick={() => handleNav('spend-analyzer', '/spend-analyzer')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-500 to-cyan-400 p-0.5 shadow-md group-hover:shadow-indigo-500/25 transition-all">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <svg className="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
          </div>
          <span className="font-extrabold text-xl tracking-tight text-white">
            Spend<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500">Wise</span>
          </span>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-2">
          <button
            onClick={() => handleNav('spend-analyzer', '/spend-analyzer')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'spend-analyzer'
              ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
          >
            <span>📊</span> Spend Analyzer
          </button>

          <button
            onClick={() => handleNav('ai-policy-recommendation', '/ai-policy-recommendation')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'ai-policy-recommendation'
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30'
              : 'text-indigo-300 bg-indigo-950/40 border border-indigo-500/30 hover:bg-indigo-900/40'
              }`}
          >
            <span className="animate-pulse">🛡️</span> AI Policy Advisor
          </button>
        </nav>

      </div>
    </header>
  );
};
