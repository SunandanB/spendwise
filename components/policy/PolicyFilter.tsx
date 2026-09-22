import React from 'react';
import { ProductCategory } from '../../types/policy';

interface PolicyFilterProps {
  categories: { cat: string; count: number }[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  sortBy: 'match' | 'risk' | 'category';
  onSortChange: (sort: 'match' | 'risk' | 'category') => void;
}

export const PolicyFilter: React.FC<PolicyFilterProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange
}) => {
  return (
    <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 backdrop-blur-xl space-y-4">
      
      {/* Search and Sort controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Search bar */}
        <div className="relative w-full sm:w-80">
          <svg className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search policies within institution..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Sort option */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e: any) => onSortChange(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="match">✨ AI Match Score</option>
            <option value="risk">🛡️ Risk Score</option>
            <option value="category">📁 Category</option>
          </select>
        </div>

      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => onSelectCategory('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            selectedCategory === 'all'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
              : 'bg-slate-950/60 text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          <span>All Categories</span>
          <span className="bg-slate-800/80 px-1.5 py-0.5 rounded-full text-[10px]">{categories.reduce((a, b) => a + b.count, 0)}</span>
        </button>

        {categories.map((item) => (
          <button
            key={item.cat}
            onClick={() => onSelectCategory(item.cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedCategory === item.cat
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                : 'bg-slate-950/60 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            <span>{item.cat}</span>
            <span className="bg-slate-800/80 px-1.5 py-0.5 rounded-full text-[10px]">{item.count}</span>
          </button>
        ))}
      </div>

    </div>
  );
};
