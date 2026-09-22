import { PolicyProduct, RecommendationRequest, ProductCategory, RiskLevel } from '../types/policy';

export class AIService {
  /**
   * System Prompt as specified in production requirements
   */
  private static readonly SYSTEM_PROMPT = `You are an expert AI financial product recommendation analyst.

Based on the user's monthly income, investment amount, and selected financial institution, identify premier, top-performing investment, insurance, mutual fund, retirement, and savings products associated with that institution.

CRITICAL CONSTRAINTS:
1. Provide ONLY products that belong to the specified financial institution. Do NOT include products from competing institutions.
2. If the institution is a valid financial entity anywhere in the world, return its ACTUAL real-world products that genuinely exist today. Do NOT invent product names. Product names must EXACTLY match the official names on the institution's website.
3. If the specified institution has NO investment/insurance products (e.g. non-financial company like Nike, McDonald's) or is gibberish, return an empty array "products": [].
4. MANDATORY QUANTITY (AT LEAST 7 TO 10 PRODUCTS):
   - You MUST return a minimum of 7 products and up to 10 products (strictly 7 to 10 products in the "products" array).
   - Under NO circumstances return fewer than 7 products if the institution is a recognized financial entity. Returning only 3, 4, 5, or 6 products is STRICTLY FORBIDDEN.
5. QUALITY & RETURN PERCENTAGE (NO RANDOM FUNDS):
   - Do NOT return random, obscure, mediocre, or arbitrary funds.
   - Select ONLY polished, premier, top-performing, and top-rated products/funds (e.g., 5-star or 4-star CRISIL/Morningstar rated, benchmark-beating flagship schemes, highest historical 3-5 year CAGR equity/mutual funds, high-yield fixed deposits/savings plans, and top-tier insurance policies with high claim settlement ratios).
   - Rank and order the products in the "products" array primarily on the basis of return percentage / wealth creation potential (highest return/growth first).
   - For every product, provide clear, realistic return figures in the "returns" field (e.g., "18.5% CAGR (5-Yr)", "15.2% p.a.", "8.1% p.a. Guaranteed", "Pure Protection / High CSR 99.2%").
6. BALANCED PORTFOLIO & CATEGORY DIVERSITY (AT LEAST 1 PER CATEGORY):
   - You MUST include AT LEAST 1 polished, top-rated product for EACH major category that the institution offers or facilitates:
     • At least 1 "Mutual Funds" (Flagship Flexicap / Bluechip / Index fund with highest CAGR)
     • At least 1 "Term Insurance" (Top pure risk life cover with high claim settlement ratio)
     • At least 1 "Health Insurance" or "Life Insurance" (Comprehensive health coverage or guaranteed savings life plan)
     • At least 1 "ULIPs" (Top market-linked wealth generation plan)
     • At least 1 "Pension/Retirement" (Top retirement annuity / superannuation fund)
     • At least 1 "Fixed Income/Savings Plans" (High-interest fixed deposit or guaranteed return plan)
   - Fill all remaining slots with the institution's highest-return flagship mutual funds or growth equity products to satisfy the strict 7-10 products requirement.
   - If the institution is a specialized entity (e.g., an AMC only or an Insurer only), provide at least 1 product across each of its internal sub-categories / fund asset classes, and fill with its highest-return flagship schemes to reach 7-10 products.

REQUIRED OUTPUT FORMAT:
You MUST respond with a valid, raw JSON object (no markdown fence blocks, no conversational preamble).
The JSON object must follow this exact schema:

{
  "institution": "Normalized Institution Name",
  "aiInsightsText": "A 2-3 paragraph simple natural language explanation of the overall allocation strategy for this user's monthly income and budget.",
  "products": [
    {
      "id": "unique-slug-id",
      "name": "Full Official Product Name",
      "category": "Term Insurance" | "Life Insurance" | "Health Insurance" | "ULIPs" | "Mutual Funds" | "Pension/Retirement" | "Fixed Income/Savings Plans" | "Other Investment Products",
      "riskLevel": "Low Risk" | "Moderate Risk" | "High Risk",
      "riskScore": 1-100 number,
      "returns": "Expected return percentage or benefit type (e.g. 18.5% CAGR (5-Yr) or 8.1% p.a. Guaranteed)",
      "taxBenefit": "Tax section or exemption status (e.g. Section 80C & 10(10D))",
      "minInvestment": number,
      "recommendedBudgetPct": number (percentage of user budget),
      "suitability": "Simple explanation of who this product is best suited for",
      "summary": "1-2 sentence overview highlighting why this is a top-rated product",
      "simpleExplanation": "Jargon-free explanation in simple language",
      "recommendationRationale": "Clear rationale on why AI recommends this top-performing product based on return percentage and budget",
      "keyFeatures": ["Feature 1", "Feature 2", "Feature 3", "Feature 4"],
      "matchScore": 98
    }
  ]
}`;

  /**
   * Dynamically discovers policy and investment products using LLM API — ZERO hardcoded products
   */
  public static async discoverProducts(req: RecommendationRequest): Promise<{
    institution: string;
    aiInsightsText: string;
    products: PolicyProduct[];
  }> {
    const { monthlyIncome, investmentAmount, companyName, apiKey, provider } = req;

    const userPrompt = `
USER FINANCIAL PROFILE:
- Monthly Income: ₹${monthlyIncome.toLocaleString('en-IN')}
- Intended Monthly Investment: ₹${investmentAmount.toLocaleString('en-IN')}
- Selected Financial Institution: "${companyName}"

REQUIREMENTS:
1. Dynamically identify, analyze, and return AT LEAST 7 to 10 top-performing, premier products belonging ONLY to "${companyName}".
2. Select strictly on the basis of return percentage and market rating (no random or obscure funds; only polished, top-rated funds).
3. Include at least 1 product for each category (Mutual Funds, Term Insurance, Health Insurance/Life Insurance, ULIPs, Pension/Retirement, Fixed Income/Savings Plans) as applicable to "${companyName}".
4. Order products primarily by return percentage / growth performance (highest returns first).
5. Ensure exact official product names.
6. Return valid JSON adhering strictly to the system schema with AT LEAST 7 to 10 products in the "products" array.`;

    // Require API key — no hardcoded fallback data
    const key = apiKey || '';

    if (!key) {
      return {
        institution: companyName,
        aiInsightsText: `⚠️ Please enter your Google Gemini API Key to search for investment products from "${companyName}". The AI agent needs an API key to fetch real-world product data.`,
        products: []
      };
    }

    try {
      const rawJson = await this.callCloudLLM(key, provider || 'gemini', this.SYSTEM_PROMPT, userPrompt);
      if (rawJson) {
        const parsed = this.cleanAndParseJSON(rawJson, companyName);
        if (parsed && parsed.products) {
          return parsed;
        }
      }
      return {
        institution: companyName,
        aiInsightsText: `❌ No valid response received from Gemini AI for "${companyName}". Please try again.`,
        products: []
      };
    } catch (err: any) {
      console.error('Cloud LLM fetch error:', err);
      return {
        institution: companyName,
        aiInsightsText: `❌ Failed to connect to Gemini AI: ${err?.message || 'Unknown error'}. Please check your API key and internet connection.`,
        products: []
      };
    }
  }

  /**
   * Calls Gemini or OpenAI LLM REST API
   */
  private static async callCloudLLM(key: string, provider: string, systemPrompt: string, userPrompt: string): Promise<string | null> {
    if (provider === 'openai' || key.startsWith('sk-')) {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: 'json_object' }
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        return data.choices[0]?.message?.content || null;
      }
    } else {
      // Google Gemini API
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${key}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
          ],
          generationConfig: { 
            temperature: 0.1,
            maxOutputTokens: 8192
          }
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        return data.candidates[0]?.content?.parts[0]?.text || null;
      }
    }
    return null;
  }

  /**
   * Sanitizes and parses LLM JSON string safely
   */
  private static cleanAndParseJSON(rawText: string, defaultCompany: string): any {
    try {
      let cleanText = rawText.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```/, '').replace(/```$/, '').trim();
      }
      const data = JSON.parse(cleanText);
      if (data.products && Array.isArray(data.products)) {
        data.products = data.products.map((p: any, idx: number) => ({
          ...p,
          id: p.id || `ai-${Date.now()}-${idx}`,
          institution: data.institution || defaultCompany,
          icon: this.getCategoryIcon(p.category),
          matchScore: typeof p.matchScore === 'number' ? p.matchScore : Math.max(78, 98 - idx * 2)
        }));
      }
      return data;
    } catch (e) {
      console.error('Failed to parse LLM JSON:', e);
      return null;
    }
  }

  private static getCategoryIcon(cat: string): string {
    switch (cat) {
      case 'Term Insurance': return '🛡️';
      case 'Health Insurance': return '🏥';
      case 'Mutual Funds': return '💰';
      case 'ULIPs': return '📈';
      case 'Pension/Retirement': return '👵';
      case 'Fixed Income/Savings Plans': return '🏦';
      case 'Life Insurance': return '👨‍👩‍👧‍👦';
      default: return '💎';
    }
  }
}
