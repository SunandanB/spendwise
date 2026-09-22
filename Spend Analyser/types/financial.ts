export interface IncomeBudgetSummary {
  monthlyIncome: number;
  monthlyInvestment: number;
  savingsRatePct: number;
  recommendedTermCover: number;
  estimatedAnnualTaxSavings: number;
  aiSuitabilityIndex: number;
}

export interface ReturnCalculationInput {
  monthlyAmount: number;
  years: number;
  expectedReturnRate: number;
}

export interface ReturnCalculationResult {
  totalInvested: number;
  estimatedWealthGain: number;
  projectedMaturityValue: number;
}
