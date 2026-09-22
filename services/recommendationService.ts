import { FinancialProfile } from '../types/policy';
import { IncomeBudgetSummary, ReturnCalculationInput, ReturnCalculationResult } from '../types/financial';

export class RecommendationService {
  /**
   * Generates financial profile metrics from user income and investment budget
   */
  public static calculateFinancialProfile(monthlyIncome: number, monthlyInvestment: number, companyName: string): FinancialProfile {
    const annualIncome = monthlyIncome * 12;
    const annualInvestment = monthlyInvestment * 12;
    const savingsRatePct = parseFloat(((monthlyInvestment / monthlyIncome) * 100).toFixed(1));

    return {
      monthlyIncome,
      monthlyInvestment,
      companyName,
      annualIncome,
      annualInvestment,
      savingsRatePct
    };
  }

  /**
   * Calculates income budget summary metrics
   */
  public static getIncomeBudgetSummary(profile: FinancialProfile): IncomeBudgetSummary {
    const annualIncome = profile.annualIncome;
    const annualInvestment = profile.annualInvestment;

    // Recommended term cover: 20X annual income
    const recommendedTermCover = annualIncome * 20;

    // Tax savings estimation under Section 80C & 80D (approx 31.2% slab)
    const max80C = Math.min(annualInvestment, 150000);
    const estimatedAnnualTaxSavings = Math.round(max80C * 0.312);

    // AI Suitability Index calculation
    let score = 85;
    if (profile.savingsRatePct >= 20 && profile.savingsRatePct <= 40) score += 10;
    else if (profile.savingsRatePct > 40) score += 8;
    else score += Math.round(profile.savingsRatePct / 2);
    score = Math.min(99, Math.max(75, score));

    return {
      monthlyIncome: profile.monthlyIncome,
      monthlyInvestment: profile.monthlyInvestment,
      savingsRatePct: profile.savingsRatePct,
      recommendedTermCover,
      estimatedAnnualTaxSavings,
      aiSuitabilityIndex: score
    };
  }

  /**
   * Estimates compound interest & SIP maturity returns
   */
  public static calculateProjectedReturns(input: ReturnCalculationInput): ReturnCalculationResult {
    const P = input.monthlyAmount;
    const Y = input.years;
    const R = input.expectedReturnRate;

    const months = Y * 12;
    const totalInvested = P * months;

    let projectedMaturityValue = totalInvested;
    if (R > 0) {
      const i = (R / 100) / 12;
      projectedMaturityValue = P * ((Math.pow(1 + i, months) - 1) / i) * (1 + i);
    }

    const estimatedWealthGain = Math.max(0, projectedMaturityValue - totalInvested);

    return {
      totalInvested: Math.round(totalInvested),
      estimatedWealthGain: Math.round(estimatedWealthGain),
      projectedMaturityValue: Math.round(projectedMaturityValue)
    };
  }
}
