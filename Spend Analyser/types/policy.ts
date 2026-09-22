export type ProductCategory = 
  | 'Term Insurance'
  | 'Life Insurance'
  | 'Health Insurance'
  | 'ULIPs'
  | 'Mutual Funds'
  | 'Pension/Retirement'
  | 'Fixed Income/Savings Plans'
  | 'Other Investment Products';

export type RiskLevel = 'Low Risk' | 'Moderate Risk' | 'High Risk';

export interface PolicyProduct {
  id: string;
  name: string;
  category: ProductCategory;
  institution: string;
  icon?: string;
  riskLevel: RiskLevel;
  riskScore: number; // 1-100
  returns: string;
  taxBenefit: string;
  minInvestment: number;
  recommendedBudgetPct: number;
  suitability: string;
  summary: string;
  simpleExplanation: string;
  recommendationRationale: string;
  keyFeatures: string[];
  matchScore: number; // Percentage, e.g. 95
}

export interface FinancialProfile {
  monthlyIncome: number;
  monthlyInvestment: number;
  companyName: string;
  annualIncome: number;
  annualInvestment: number;
  savingsRatePct: number;
}

export interface RecommendationRequest {
  monthlyIncome: number;
  investmentAmount: number;
  companyName: string;
  apiKey?: string;
  provider?: 'gemini' | 'openai' | 'free_llm';
}

export interface AIRecommendationResponse {
  success: boolean;
  institution: string;
  financialProfile: FinancialProfile;
  aiInsightsText: string;
  products: PolicyProduct[];
  error?: string;
}
