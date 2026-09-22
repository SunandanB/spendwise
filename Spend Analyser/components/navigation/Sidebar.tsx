import React from 'react';

interface SidebarProps {
  activeTab: 'spend-analyzer' | 'ai-policy-recommendation';
  onNavigate?: (tab: 'spend-analyzer' | 'ai-policy-recommendation') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onNavigate }) => {
  const handleNav = (tab: 'spend-analyzer' | 'ai-policy-recommendation', url: string) => {
    if (onNavigate) {
      onNavigate(tab);
    } else if (typeof window !== 'undefined') {
      window.location.href = url;
    }
  };

  return (
    <aside className="w-64 bg-slate-900/60 border-r border-slate-800/60 p-4 flex flex-col justify-between hidden lg:flex min-h-screen backdrop-blur-md">
      <div className="space-y-6">
        <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Financial Hub
        </div>

        <nav className="space-y-1.5">
          <button
            onClick={() => handleNav('spend-analyzer', '/spend-analyzer')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
              activeTab === 'spend-analyzer'
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <span className="text-base">📊</span>
            <span>Spend Analyzer</span>
          </button>

          <button
            onClick={() => handleNav('ai-policy-recommendation', '/ai-policy-recommendation')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
              activeTab === 'ai-policy-recommendation'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
            }`}
          >
            <span className="text-base">📈</span>
            <span>Investment Product Finder</span>
          </button>
        </nav>
      </div>

      <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60 text-xs text-slate-400">
        <p className="font-semibold text-slate-300">SpendWise AI v2.0</p>
        <p className="mt-1">Dynamic financial product discovery powered by LLMs.</p>
      </div>
    </aside>
  );
};
