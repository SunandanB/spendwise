import { useState, useMemo } from 'react';
import { RecommendationRequest, AIRecommendationResponse, PolicyProduct, FinancialProfile } from '../types/policy';

export function usePolicyRecommendation() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AIRecommendationResponse | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'match' | 'risk' | 'category'>('match');
  const [inspectProduct, setInspectProduct] = useState<PolicyProduct | null>(null);

  const fetchRecommendations = async (req: RecommendationRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Try server API route endpoint
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req)
      });

      if (response.ok) {
        const resData: AIRecommendationResponse = await response.json();
        if (resData.success) {
          setData(resData);
          setIsLoading(false);
          return;
        }
      }

      // 2. Direct client service invocation as robust fallback
      const { AIService } = await import('../services/aiService');
      const { RecommendationService } = await import('../services/recommendationService');

      const profile: FinancialProfile = RecommendationService.calculateFinancialProfile(
        req.monthlyIncome,
        req.investmentAmount,
        req.companyName
      );

      const aiResult = await AIService.discoverProducts(req);

      const fallbackData: AIRecommendationResponse = {
        success: true,
        institution: aiResult.institution,
        financialProfile: profile,
        aiInsightsText: aiResult.aiInsightsText,
        products: aiResult.products
      };

      setData(fallbackData);
    } catch (err: any) {
      console.error('Error fetching AI policy recommendations:', err);
      setError(err?.message || 'Failed to generate recommendations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Category counts
  const categories = useMemo(() => {
    if (!data || !data.products) return [];
    const map = new Map<string, number>();
    data.products.forEach((p) => {
      map.set(p.category, (map.get(p.category) || 0) + 1);
    });
    return Array.from(map.entries()).map(([cat, count]) => ({ cat, count }));
  }, [data]);

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    if (!data || !data.products) return [];

    let result = data.products.filter((product) => {
      const catMatch = selectedCategory === 'all' || product.category === selectedCategory;
      const searchMatch =
        !searchQuery ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase());
      return catMatch && searchMatch;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'match') return (b.matchScore || 0) - (a.matchScore || 0);
      if (sortBy === 'risk') return a.riskScore - b.riskScore;
      if (sortBy === 'category') return a.category.localeCompare(b.category);
      return 0;
    });

    return result;
  }, [data, selectedCategory, searchQuery, sortBy]);

  return {
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
  };
}
