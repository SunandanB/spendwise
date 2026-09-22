import { AIService } from '../../../services/aiService';
import { RecommendationService } from '../../../services/recommendationService';
import { RecommendationRequest, AIRecommendationResponse } from '../../../types/policy';

export async function POST(request: Request) {
  try {
    const body: RecommendationRequest = await request.json();
    const { monthlyIncome, investmentAmount, companyName, apiKey, provider } = body;

    if (!monthlyIncome || monthlyIncome <= 0) {
      return Response.json({ success: false, error: 'Monthly Income must be a positive number' }, { status: 400 });
    }
    if (!investmentAmount || investmentAmount <= 0) {
      return Response.json({ success: false, error: 'Investment Amount must be a positive number' }, { status: 400 });
    }
    if (!companyName || !companyName.trim()) {
      return Response.json({ success: false, error: 'Financial Institution Name is required' }, { status: 400 });
    }

    // 1. Calculate financial profile
    const profile = RecommendationService.calculateFinancialProfile(monthlyIncome, investmentAmount, companyName);

    // 2. Discover products dynamically using AI
    const aiResult = await AIService.discoverProducts({
      monthlyIncome,
      investmentAmount,
      companyName,
      apiKey,
      provider
    });

    const responsePayload: AIRecommendationResponse = {
      success: true,
      institution: aiResult.institution,
      financialProfile: profile,
      aiInsightsText: aiResult.aiInsightsText,
      products: aiResult.products
    };

    return Response.json(responsePayload, { status: 200 });

  } catch (error: any) {
    console.error('API Error in /api/recommendations:', error);
    return Response.json({
      success: false,
      error: error?.message || 'Failed to generate dynamic AI policy recommendations'
    }, { status: 500 });
  }
}
