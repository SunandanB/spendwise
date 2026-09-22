'use client';

import React from 'react';
import { Navbar } from '../../components/navigation/Navbar';
import { Sidebar } from '../../components/navigation/Sidebar';
import { PolicyForm } from '../../components/policy/PolicyForm';
import { PolicyOverview } from '../../components/policy/PolicyOverview';
import { PolicyFilter } from '../../components/policy/PolicyFilter';
import { PolicyCard } from '../../components/policy/PolicyCard';
import { PolicyDetailsModal } from '../../components/policy/PolicyDetailsModal';
import { PolicyCardSkeleton } from '../../components/ui/skeleton';
import { usePolicyRecommendation } from '../../hooks/usePolicyRecommendation';

export default function AIPolicyRecommendationPage() {
  const {
    isLoading,
    error,
    data,
    categories,
    filteredProducts,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    inspectProduct,
    setInspectProduct,
    fetchRecommendations
  } = usePolicyRecommendation();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Top Navbar */}
      <Navbar activeTab="ai-policy-recommendation" />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        
        {/* Sidebar Navigation */}
        <Sidebar activeTab="ai-policy-recommendation" />

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 space-y-8 overflow-y-auto">
          
          {/* Hero Banner */}
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20">
              <span className="animate-pulse">✨</span> Dynamic AI Product Discovery Engine
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              AI Policy & Investment <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-violet-400 to-pink-500">Recommendations</span>
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Enter your monthly income, budget, and selected financial institution (*Axis Bank, Hostplus, HDFC, TATA, LIC, Vanguard, etc.*) to dynamically discover tailored insurance and investment plans.
            </p>
          </div>

          {/* Form Component */}
          <div className="max-w-4xl mx-auto">
            <PolicyForm onSubmit={fetchRecommendations} isLoading={isLoading} />
          </div>

          {/* Loading Skeletons */}
          {isLoading && (
            <div className="max-w-5xl mx-auto space-y-6 pt-4">
              <div className="h-40 rounded-2xl bg-slate-900/60 animate-pulse border border-slate-800" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PolicyCardSkeleton />
                <PolicyCardSkeleton />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="max-w-3xl mx-auto p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-sm text-center">
              ⚠️ {error}
            </div>
          )}

          {/* Empty State Notice for Companies with 0 Products */}
          {data && data.products.length === 0 && !isLoading && (
            <div className="max-w-3xl mx-auto p-8 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-center space-y-4">
              <div className="text-4xl">⚠️</div>
              <h2 className="text-xl font-bold text-amber-300">No Investment Products Found for "{data.institution}"</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                The specified institution does not have registered insurance, mutual fund, or wealth products in our financial discovery database.
              </p>
            </div>
          )}

          {/* Results Overview & Filter Bar */}
          {data && data.products.length > 0 && !isLoading && (
            <div className="max-w-6xl mx-auto space-y-8 pt-4">
              
              {/* Financial Profile Overview Card */}
              <PolicyOverview
                profile={data.financialProfile}
                institution={data.institution}
                aiInsightsText={data.aiInsightsText}
              />

              {/* Search & Category Filter Controls */}
              <PolicyFilter
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                sortBy={sortBy}
                onSortChange={setSortBy}
              />

              {/* Product Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {filteredProducts.map((product) => (
                  <PolicyCard
                    key={product.id}
                    product={product}
                    monthlyBudget={data.financialProfile.monthlyInvestment}
                    onOpenDetails={setInspectProduct}
                  />
                ))}
              </div>

            </div>
          )}

        </main>
      </div>

      {/* Policy Details Modal */}
      <PolicyDetailsModal
        product={inspectProduct}
        monthlyBudget={data?.financialProfile?.monthlyInvestment || 10000}
        onClose={() => setInspectProduct(null)}
      />

    </div>
  );
}
