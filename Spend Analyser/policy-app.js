/* ========================================
   SpendWise — Production AI Policy Recommendation Engine
   100% Dynamic Discovery — ZERO Hardcoded Products
   ======================================== */

// ───────── Application State ─────────
let currentResults = [];
let selectedCategory = 'all';
let userFinancialProfile = {};

// Helper DOM selector
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
});

function setupEventListeners() {
  // Mobile Hamburger Toggle
  const hamburger = $('#hamburger-btn');
  const nav = $('#header-nav');
  if (hamburger && nav) {
    hamburger.addEventListener('click', () => {
      nav.classList.toggle('open');
      hamburger.classList.toggle('active');
    });
  }

  // Dropdown Hover & Click Toggle
  const dropdownEl = document.querySelector('.dropdown');
  const dropdownBtn = document.querySelector('.dropdown-toggle-btn');
  if (dropdownEl && dropdownBtn) {
    let dropdownTimeout = null;
    dropdownEl.addEventListener('mouseenter', () => {
      if (dropdownTimeout) { clearTimeout(dropdownTimeout); dropdownTimeout = null; }
      dropdownEl.classList.add('dropdown-open');
    });
    dropdownEl.addEventListener('mouseleave', () => {
      dropdownTimeout = setTimeout(() => {
        dropdownEl.classList.remove('dropdown-open');
      }, 500);
    });
    dropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownEl.classList.toggle('dropdown-open');
    });
    document.addEventListener('click', (e) => {
      if (!dropdownEl.contains(e.target)) {
        dropdownEl.classList.remove('dropdown-open');
      }
    });
  }

  // Quick Income Chips
  $$('#income-chips .chip-btn').forEach(chip => {
    chip.addEventListener('click', () => {
      $('#monthly-income').value = chip.getAttribute('data-val');
    });
  });

  // Quick Investment % Chips
  $$('#invest-pct-chips .chip-btn').forEach(chip => {
    chip.addEventListener('click', () => {
      const pct = parseFloat(chip.getAttribute('data-pct'));
      const income = parseFloat($('#monthly-income').value) || 0;
      if (income > 0) {
        $('#invest-amount').value = Math.round((income * pct) / 100);
      } else {
        alert('Please enter your Monthly Income first.');
      }
    });
  });

  // Toggle API Key eye button
  const keyToggle = $('#policy-key-toggle');
  const keyInput = $('#policy-gemini-key');
  if (keyToggle && keyInput) {
    keyToggle.addEventListener('click', () => {
      const isPassword = keyInput.type === 'password';
      keyInput.type = isPassword ? 'text' : 'password';
      const icon = $('#policy-eye-icon');
      if (icon) {
        icon.innerHTML = isPassword
          ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'
          : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
      }
    });
  }

  // Popular Company Chips
  $$('.company-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      $('#company-name').value = chip.getAttribute('data-company');
    });
  });

  // Suggestion Chips (in empty state)
  $$('.suggestion-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      $('#company-name').value = chip.getAttribute('data-company');
      $('#find-policies-btn').click();
    });
  });

  // Form Submission
  const policyForm = $('#policy-form');
  if (policyForm) {
    policyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleFindPolicies();
    });
  }

  // Category Tabs
  $$('.cat-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.cat-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      selectedCategory = tab.getAttribute('data-cat');
      filterAndRenderCards();
    });
  });

  // Search Bar Filter
  const searchInput = $('#policy-search');
  if (searchInput) {
    searchInput.addEventListener('input', filterAndRenderCards);
  }

  // Modal Close
  const modalClose = $('#calc-modal-close');
  const modalOverlay = $('#calc-modal-overlay');
  if (modalClose && modalOverlay) {
    modalClose.addEventListener('click', () => modalOverlay.classList.add('hidden'));
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) modalOverlay.classList.add('hidden');
    });
  }
}

// ───────── Dynamic AI Discovery Processor (ZERO HARDCODED PRODUCTS) ─────────
async function handleFindPolicies() {
  const incomeInput = parseFloat($('#monthly-income').value);
  const investInput = parseFloat($('#invest-amount').value);
  const companyInput = $('#company-name').value.trim();

  if (!incomeInput || incomeInput <= 0) {
    alert('Please enter a valid monthly income.');
    return;
  }
  if (!investInput || investInput <= 0) {
    alert('Please enter a valid monthly investment budget.');
    return;
  }
  if (!companyInput) {
    alert('Please enter a financial institution name.');
    return;
  }

  // UI State: Loading
  $('#no-products-card').classList.add('hidden');
  $('#policy-results-section').classList.add('hidden');
  $('#policy-ai-loading').classList.remove('hidden');
  $('#policy-ai-loading').scrollIntoView({ behavior: 'smooth', block: 'center' });

  userFinancialProfile = {
    monthlyIncome: incomeInput,
    monthlyInvestment: investInput,
    companyName: companyInput,
    annualIncome: incomeInput * 12,
    annualInvestment: investInput * 12,
    savingsRatePct: ((investInput / incomeInput) * 100).toFixed(1)
  };

  const apiKey = $('#policy-gemini-key') ? $('#policy-gemini-key').value.trim() : '';

  let aiResult = null;

  try {
    // Attempt Next.js API Route fetch if running in Next.js environment
    const response = await fetch('/api/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        monthlyIncome: incomeInput,
        investmentAmount: investInput,
        companyName: companyInput,
        apiKey: apiKey || undefined
      })
    });

    const contentType = response.headers.get('content-type');
    if (response.ok && contentType && contentType.includes('application/json')) {
      const apiData = await response.json();
      if (apiData.success && apiData.products && apiData.products.length > 0) {
        aiResult = apiData;
      }
    }
  } catch (err) {
    console.warn('API route not reached, running dynamic client AI engine:', err);
  }

  // Dynamic Client AI Engine (Supports ANY company e.g. Hostplus, Vanguard, Axis Bank, HDFC, TATA)
  if (!aiResult) {
    aiResult = await discoverDynamicProductsClient(incomeInput, investInput, companyInput, apiKey);
  }

  $('#policy-ai-loading').classList.add('hidden');

  // Handle empty state if non-financial entity
  if (!aiResult || !aiResult.products || aiResult.products.length === 0) {
    $('#empty-company-title').textContent = `No Investment Products Found for "${companyInput}"`;
    $('#empty-company-desc').innerHTML = `
      The entity <strong>"${escapeHTML(companyInput)}"</strong> does not appear to have registered investment, insurance, or mutual fund offerings in our financial database.
    `;
    $('#no-products-card').classList.remove('hidden');
    $('#no-products-card').scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  currentResults = aiResult.products;

  // Render Overview
  renderAIProfileOverview(userFinancialProfile, aiResult.institution || companyInput, aiResult.aiInsightsText);

  // Update Category Counts & Filter
  updateCategoryCounts();
  selectedCategory = 'all';
  $$('.cat-tab').forEach(t => t.classList.remove('active'));
  $('[data-cat="all"]')?.classList.add('active');

  filterAndRenderCards();

  $('#policy-results-section').classList.remove('hidden');
  $('#policy-results-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ───────── Dynamic AI Engine (100% Gemini API Powered) ─────────
async function discoverDynamicProductsClient(income, invest, companyInput, apiKey) {
  const compClean = companyInput.trim();

  // REQUIRE API KEY — no hardcoded fallback data
  if (!apiKey) {
    return {
      institution: compClean,
      aiInsightsText: `⚠️ Please enter your Google Gemini API Key above to search for investment products from "${compClean}". The AI agent needs an API key to fetch real-world product data.`,
      products: []
    };
  }

  // Call Gemini API for real product discovery
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`;
    const prompt = `You are an expert AI financial product recommendation analyst.
The user wants premier, top-rated, real-world financial products offered by "${compClean}".
User Monthly Income: ₹${income}/month, Monthly Investment Budget: ₹${invest}/month.

STRICT CONSTRAINTS:
1. First, verify if "${compClean}" is a REAL, recognized financial institution (bank, super fund, asset manager, insurer, mutual fund house).
2. If "${compClean}" is NOT a recognized financial institution (e.g., gibberish like "jyfjyfjfc", or non-financial companies like "Nike", "Apple", "McDonalds"), you MUST respond with EXACTLY:
   { "institution": "${compClean}", "aiInsightsText": "The entity '${compClean}' is not a recognized financial institution.", "products": [] }
3. If it IS a real financial institution, return ONLY its actual, real-world products that genuinely exist today. Do NOT invent product names. Product names must EXACTLY match the official names on the institution's website.
4. MANDATORY QUANTITY (AT LEAST 7 TO 10 PRODUCTS):
   - You MUST return a minimum of 7 products and up to 10 products (strictly 7 to 10 products in the "products" array).
   - Under NO circumstances return fewer than 7 products if the institution is a recognized financial entity. Returning only 3, 4, 5, or 6 products is STRICTLY FORBIDDEN.
5. QUALITY & RETURN PERCENTAGE (NO RANDOM FUNDS):
   - Do NOT return random, obscure, mediocre, or arbitrary funds.
   - Select ONLY polished, premier, top-performing, and top-rated products/funds (e.g., 5-star or 4-star CRISIL/Morningstar rated, benchmark-beating flagship schemes, highest historical 3-5 year CAGR equity/mutual funds, high-yield fixed deposits/savings plans, and top-tier insurance policies with high claim settlement ratios).
   - Rank and order the products in the "products" array primarily on the basis of return percentage / wealth creation potential (highest returns first).
   - In the "returns" field, provide realistic, attractive return metrics (e.g., "~18.4% CAGR (5-Yr)", "~15.2% p.a.", "~8.25% p.a. Guaranteed", "Pure Protection / High CSR 99.2%").
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

Respond ONLY in valid raw JSON (no markdown fence blocks, no backticks, no conversational preamble) matching this schema:
{
  "institution": "Official Institution Name",
  "aiInsightsText": "A 2-3 paragraph simple natural language explanation of the overall allocation strategy and top return avenues for this user's monthly income and budget.",
  "products": [
    {
      "id": "prod-1",
      "name": "Actual Real Product Name",
      "category": "Term Insurance" | "Life Insurance" | "Health Insurance" | "ULIPs" | "Mutual Funds" | "Pension/Retirement" | "Fixed Income/Savings Plans" | "Other Investment Products",
      "icon": "📈",
      "riskLevel": "Low Risk" | "Moderate Risk" | "High Risk",
      "riskScore": 25,
      "returns": "Expected return percentage or benefit e.g. ~18.5% CAGR (5-Yr)",
      "taxBenefit": "Applicable tax benefits e.g. Section 80C & 10(10D)",
      "minInvestment": 500,
      "recommendedBudgetPct": 25,
      "summary": "1-2 sentence overview highlighting why this is a top-rated product.",
      "simpleExplanation": "Jargon-free explanation in simple language.",
      "recommendationRationale": "Why AI recommends this premier product based on return percentage and user budget.",
      "keyFeatures": ["Feature 1", "Feature 2", "Feature 3", "Feature 4"],
      "matchScore": 98
    }
  ]
}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 8192
        }
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Gemini API error:', res.status, errText);
      return {
        institution: compClean,
        aiInsightsText: `❌ Gemini API returned error (${res.status}). Please check your API key and try again.`,
        products: []
      };
    }

    const json = await res.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return {
        institution: compClean,
        aiInsightsText: `❌ No response received from Gemini AI. Please try again.`,
        products: []
      };
    }

    // Clean and parse JSON response
    let clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(clean);

    // Ensure products array exists
    if (!parsed.products) parsed.products = [];

    // Add icons and defaults if missing
    parsed.products.forEach((p, i) => {
      if (!p.id) p.id = `ai-${Date.now()}-${i}`;
      if (!p.icon) {
        if (p.category === 'Term Insurance') p.icon = '🛡️';
        else if (p.category === 'Life Insurance') p.icon = '👨‍👩‍👧‍👦';
        else if (p.category === 'Health Insurance') p.icon = '🏥';
        else if (p.category === 'Mutual Funds') p.icon = '💰';
        else if (p.category === 'ULIPs') p.icon = '📈';
        else if (p.category === 'Pension/Retirement') p.icon = '👵';
        else if (p.category === 'Fixed Income/Savings Plans') p.icon = '🏦';
        else p.icon = '💎';
      }
      if (!p.keyFeatures) p.keyFeatures = [];
      if (!p.matchScore) p.matchScore = Math.max(78, 98 - i * 2);
    });

    return parsed;

  } catch (e) {
    console.error('Gemini API call failed:', e);
    return {
      institution: compClean,
      aiInsightsText: `❌ Failed to connect to Gemini AI: ${e.message}. Please check your API key and internet connection.`,
      products: []
    };
  }
}

// ───────── Render Overview & Cards ─────────
function renderAIProfileOverview(profile, companyName, insightsHTML) {
  $('#results-company-heading').textContent = `Recommended Policy Portfolio — ${companyName}`;
  $('#results-profile-sub').innerHTML = `
    Monthly Income: <strong>₹${profile.monthlyIncome.toLocaleString('en-IN')}</strong> | 
    Monthly Budget: <strong>₹${profile.monthlyInvestment.toLocaleString('en-IN')}</strong> 
    (${profile.savingsRatePct}% allocation)
  `;

  $('#metric-savings-pct').textContent = `${profile.savingsRatePct}%`;
  const rate = parseFloat(profile.savingsRatePct);
  $('#metric-savings-status').textContent = rate >= 20 ? 'Optimal Allocation' : 'Conservative Budget';

  const maxSec80C = Math.min(profile.annualInvestment, 150000);
  const estTaxSavings = Math.round(maxSec80C * 0.312);
  $('#metric-tax-savings').textContent = `₹${estTaxSavings.toLocaleString('en-IN')}`;

  const termCoverCr = (profile.annualIncome * 20 / 10000000).toFixed(2);
  $('#metric-term-cover').textContent = `₹${termCoverCr} Cr`;

  $('#metric-ai-score').textContent = `96 / 100`;
  $('#ai-insights-text').innerHTML = insightsHTML;
}

function updateCategoryCounts() {
  const counts = {
    all: currentResults.length,
    term: currentResults.filter(p => p.category === 'Term Insurance').length,
    life: currentResults.filter(p => p.category === 'Life Insurance').length,
    health: currentResults.filter(p => p.category === 'Health Insurance').length,
    ulip: currentResults.filter(p => p.category === 'ULIPs').length,
    mf: currentResults.filter(p => p.category === 'Mutual Funds').length,
    pension: currentResults.filter(p => p.category === 'Pension/Retirement').length,
    savings: currentResults.filter(p => p.category === 'Fixed Income/Savings Plans').length,
    other: currentResults.filter(p => p.category === 'Other Investment Products').length
  };

  $('#count-cat-all').textContent = counts.all;
  $('#count-cat-term').textContent = counts.term;
  $('#count-cat-life').textContent = counts.life;
  $('#count-cat-health').textContent = counts.health;
  $('#count-cat-ulip').textContent = counts.ulip;
  $('#count-cat-mf').textContent = counts.mf;
  $('#count-cat-pension').textContent = counts.pension;
  $('#count-cat-savings').textContent = counts.savings;
  $('#count-cat-other').textContent = counts.other;
}

function filterAndRenderCards() {
  const grid = $('#policy-cards-grid');
  grid.innerHTML = '';

  const searchQuery = ($('#policy-search') ? $('#policy-search').value.toLowerCase().trim() : '');

  const filtered = currentResults.filter(product => {
    const catMatch = (selectedCategory === 'all' || product.category === selectedCategory);
    const searchMatch = !searchQuery ||
      product.name.toLowerCase().includes(searchQuery) ||
      product.summary.toLowerCase().includes(searchQuery) ||
      product.category.toLowerCase().includes(searchQuery);
    return catMatch && searchMatch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="card card--no-filtered-results">
        <p>No products match your current category filter or search query.</p>
      </div>
    `;
    return;
  }

  filtered.forEach(product => {
    grid.appendChild(createProductCardHTML(product));
  });
}

function createProductCardHTML(product) {
  const card = document.createElement('div');
  card.className = 'card policy-card';

  let catClass = 'badge--term';
  if (product.category === 'Health Insurance') catClass = 'badge--health';
  else if (product.category === 'Mutual Funds') catClass = 'badge--mf';
  else if (product.category === 'ULIPs') catClass = 'badge--ulip';
  else if (product.category === 'Fixed Income/Savings Plans') catClass = 'badge--savings';
  else if (product.category === 'Pension/Retirement') catClass = 'badge--pension';
  else if (product.category === 'Life Insurance') catClass = 'badge--life';

  const userBudget = userFinancialProfile.monthlyInvestment || 10000;
  let suggestedAllocation = Math.round(userBudget * (product.recommendedBudgetPct || 20) / 100);
  suggestedAllocation = Math.max(suggestedAllocation, product.minInvestment || 500);

  const featuresHTML = product.keyFeatures.map(feat => `<li>${escapeHTML(feat)}</li>`).join('');

  card.innerHTML = `
    <div class="policy-card-header">
      <div class="cat-badge-wrap">
        <span class="policy-cat-badge ${catClass}">${product.icon || '🛡️'} ${escapeHTML(product.category)}</span>
        <span class="company-tag">${escapeHTML(userFinancialProfile.companyName)}</span>
      </div>
      <span class="risk-badge">${escapeHTML(product.riskLevel)}</span>
    </div>

    <h3 class="policy-title">${escapeHTML(product.name)}</h3>
    <p class="policy-summary">${escapeHTML(product.summary)}</p>

    <div class="ai-simple-box">
      <span class="ai-simple-label">💡 AI Simple Explanation:</span>
      <p class="ai-simple-text">${escapeHTML(product.simpleExplanation)}</p>
    </div>

    <div class="policy-metrics-strip">
      <div class="p-metric">
        <span class="p-metric-label">Suggested Monthly</span>
        <span class="p-metric-value green-text">₹${suggestedAllocation.toLocaleString('en-IN')}</span>
      </div>
      <div class="p-metric">
        <span class="p-metric-label">Return Payout</span>
        <span class="p-metric-value">${escapeHTML(product.returns)}</span>
      </div>
      <div class="p-metric">
        <span class="p-metric-label">Tax Benefit</span>
        <span class="p-metric-value purple-text">${escapeHTML(product.taxBenefit)}</span>
      </div>
    </div>

    <div class="policy-features-box">
      <span class="features-heading">Key Product Highlights:</span>
      <ul class="policy-features-list">
        ${featuresHTML}
      </ul>
    </div>

    <div class="policy-card-footer">
      <div class="match-score">
        <span class="sparkle">✨</span> AI Fit: <strong>${product.matchScore || 95}% Match</strong>
      </div>
      <button class="btn btn--secondary btn--sm btn-calc-modal" data-id="${product.id}">
        Calculate Returns
      </button>
    </div>
  `;

  // Attach Calculate Returns click handler via event delegation
  const calcBtn = card.querySelector('.btn-calc-modal');
  if (calcBtn) {
    calcBtn.addEventListener('click', () => openCalcModal(product));
  }

  return card;
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ───────── Calculate Returns Modal ─────────
function openCalcModal(product) {
  const overlay = $('#calc-modal-overlay');
  const title = $('#calc-modal-title');
  const body = $('#calc-modal-body');
  if (!overlay || !body) return;

  const monthlyInvest = userFinancialProfile.monthlyInvestment || 10000;
  const budgetPct = product.recommendedBudgetPct || 20;
  const monthlySIP = Math.max(Math.round(monthlyInvest * budgetPct / 100), product.minInvestment || 500);

  // Parse return rate from product.returns string (e.g. "~14.5% CAGR" -> 14.5)
  const rateMatch = product.returns ? product.returns.match(/(\d+\.?\d*)\s*%/) : null;
  const annualRate = rateMatch ? parseFloat(rateMatch[1]) : 10;
  const monthlyRate = annualRate / 12 / 100;

  // Calculate projections for 5, 10, 15, 20 years
  const projections = [5, 10, 15, 20].map(years => {
    const months = years * 12;
    const totalInvested = monthlySIP * months;
    // SIP compound formula: FV = P × [((1 + r)^n - 1) / r] × (1 + r)
    let futureValue;
    if (monthlyRate > 0) {
      futureValue = monthlySIP * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
    } else {
      futureValue = totalInvested;
    }
    const gains = futureValue - totalInvested;
    return { years, totalInvested, futureValue: Math.round(futureValue), gains: Math.round(gains) };
  });

  title.textContent = `📊 Return Estimator — ${product.name}`;

  body.innerHTML = `
    <div style="margin-bottom:16px">
      <p style="margin:0 0 4px"><strong>Product:</strong> ${escapeHTML(product.name)}</p>
      <p style="margin:0 0 4px"><strong>Category:</strong> ${escapeHTML(product.category)}</p>
      <p style="margin:0 0 4px"><strong>Risk Level:</strong> ${escapeHTML(product.riskLevel)}</p>
      <p style="margin:0 0 4px"><strong>Expected Return:</strong> ${escapeHTML(product.returns)}</p>
      <p style="margin:0 0 12px"><strong>Monthly SIP Amount:</strong> ₹${monthlySIP.toLocaleString('en-IN')}</p>
    </div>

    <table style="width:100%; border-collapse:collapse; font-size:14px;">
      <thead>
        <tr style="background:var(--bg-secondary, #1e293b); color:var(--text-primary, #e2e8f0);">
          <th style="padding:10px 12px; text-align:left; border-bottom:2px solid var(--accent, #6366f1);">Duration</th>
          <th style="padding:10px 12px; text-align:right; border-bottom:2px solid var(--accent, #6366f1);">Total Invested</th>
          <th style="padding:10px 12px; text-align:right; border-bottom:2px solid var(--accent, #6366f1);">Est. Value</th>
          <th style="padding:10px 12px; text-align:right; border-bottom:2px solid var(--accent, #6366f1);">Est. Gains</th>
        </tr>
      </thead>
      <tbody>
        ${projections.map(p => `
          <tr style="border-bottom:1px solid rgba(255,255,255,0.06);">
            <td style="padding:10px 12px; font-weight:600;">${p.years} Years</td>
            <td style="padding:10px 12px; text-align:right;">₹${p.totalInvested.toLocaleString('en-IN')}</td>
            <td style="padding:10px 12px; text-align:right; color:#22c55e; font-weight:600;">₹${p.futureValue.toLocaleString('en-IN')}</td>
            <td style="padding:10px 12px; text-align:right; color:#a78bfa;">₹${p.gains.toLocaleString('en-IN')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <p style="margin-top:12px; font-size:12px; opacity:0.6;">⚠️ These are estimated projections based on ${annualRate}% annual returns. Actual returns may vary. Past performance is not indicative of future results.</p>
  `;

  overlay.classList.remove('hidden');
}
