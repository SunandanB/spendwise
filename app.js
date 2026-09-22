/* ========================================
   SpendWise — Application Logic
   ======================================== */

// ───────── State ─────────
let parsedData = [];      // Array of { date, description, amount, parsedDate }
let fileHeaders = [];     // Column headers from the uploaded file
let rawRows = [];         // Raw data rows (after header row)
let headerRowIndex = 0;   // Which row in the original file is the header
let allFileRows = [];     // ALL rows from the file (before header detection)
let pieChart = null;
let barChart = null;
let weeklyChart = null;
let investChart = null;

// Stored analysis state for AI recommendations
let analysisState = {};

// ───────── DOM References ─────────
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const uploadZone = $('#upload-zone');
const fileInput = $('#file-input');
const fileInfo = $('#file-info');
const fileName = $('#file-name');
const removeFileBtn = $('#remove-file-btn');
const analyzeBtn = $('#analyze-btn');
const loadingOverlay = $('#loading-overlay');
const uploadSection = $('#upload-section');
const dashboardSection = $('#dashboard-section');
const recoSection = $('#recommendations-section');
const aiSection = $('#ai-section');
const backBtn = $('#back-to-upload-btn');

// Config
const expenseRange = $('#target-expense-range');
const expenseInput = $('#target-expense');
const savingsRange = $('#target-savings-range');
const savingsInput = $('#target-savings');
const goalExpSeg = $('#goal-expense-seg');
const goalSavSeg = $('#goal-savings-seg');
const goalInvSeg = $('#goal-invest-seg');

// Modal
const modalOverlay = $('#column-modal-overlay');
const modalFields = $('#modal-fields');
const modalCancel = $('#modal-cancel-btn');
const modalConfirm = $('#modal-confirm-btn');

// Hamburger
const hamburgerBtn = $('#hamburger-btn');
const headerNav = $('#header-nav');

// AI
const aiKeyInput = $('#gemini-api-key');
const aiKeyToggle = $('#ai-key-toggle');
const aiGenerateBtn = $('#ai-generate-btn');
const aiResults = $('#ai-results');
const aiRecoGrid = $('#ai-reco-grid');
const aiLoading = $('#ai-loading');
const aiError = $('#ai-error');
const aiErrorMsg = $('#ai-error-msg');
const aiRetryBtn = $('#ai-retry-btn');
const aiRegenerateBtn = $('#ai-regenerate-btn');

// ───────── Header Detection Keywords ─────────
// These keywords signal that a row is the actual table header
const HEADER_KEYWORDS = [
  'date', 'txn date', 'transaction date', 'value date', 'posting date', 'txn_date',
  'description', 'transaction remarks', 'narration', 'particular', 'details', 'remark', 'narrative', 'memo', 'payee',
  'amount', 'debit', 'credit', 'withdrawal', 'deposit', 'dr', 'cr',
  'balance', 'closing balance', 'running balance',
  'ref', 'reference', 'chq', 'cheque', 'utr'
];

// ───────── Investment Keywords ─────────
// Transactions matching these are classified as investments, not expenses
const INVESTMENT_KEYWORDS = [
  'lic premium', 'lic policy', 'life insurance',
  'mutual fund', 'sip mutual', 'sbi sip', 'hdfc sip', 'icici sip', 'sip investment', 'sip ',
  'ppf', 'public provident', 'epf', 'employee provident', 'pf contribution',
  'nps', 'national pension', 'pension fund',
  'elss', 'tax saver fund', 'tax saving',
  'fixed deposit', 'recurring deposit',
  'ulip', 'endowment', 'groww pay services',
  'axis mutual fund',
  'fund investment', 'mutual fund investment'
];

// ───────── Investment Type Classifier ─────────
function getInvestmentType(desc) {
  const d = desc.toLowerCase();
  if (d.includes('lic') || d.includes('life insurance') || d.includes('endowment') || d.includes('ulip')) return 'Insurance';
  if (d.includes('mutual fund') || d.includes('sip') || d.includes('groww pay services') || d.includes('elss')) return 'Mutual Fund / SIP';
  if (d.includes('ppf') || d.includes('public provident')) return 'PPF';
  if (d.includes('epf') || d.includes('employee provident') || d.includes('pf contribution')) return 'EPF';
  if (d.includes('nps') || d.includes('national pension') || d.includes('pension')) return 'NPS';
  if (d.includes('fixed deposit')) return 'Fixed Deposit';
  if (d.includes('recurring deposit')) return 'Recurring Deposit';
  return 'Other Investment';
}

function isInvestment(desc) {
  const d = desc.toLowerCase();
  return INVESTMENT_KEYWORDS.some(kw => d.includes(kw));
}

// ───────── Category Keywords ─────────
const CATEGORIES = {
  'Food & Dining': [
    'restaurant', 'food', 'swiggy', 'zomato', 'uber eats', 'pizza', 'burger',
    'cafe', 'coffee', 'starbucks', 'mcdonald', 'domino', 'dining', 'lunch',
    'dinner', 'breakfast', 'eat', 'meal', 'kitchen', 'bakery', 'chai', 'tea',
    'biryani', 'snack', 'canteen', 'mess', 'pan'
  ],
  'Groceries': [
    'grocery', 'supermarket', 'bigbasket', 'blinkit', 'instamart', 'zepto',
    'dmart', 'reliance fresh', 'more', 'vegetables', 'fruits', 'provision',
    'kirana', 'mart', 'store', 'market'
  ],
  'Transport': [
    'uber', 'ola', 'lyft', 'cab', 'taxi', 'auto', 'rickshaw', 'metro',
    'bus', 'train', 'irctc', 'fuel', 'petrol', 'diesel', 'gas station',
    'parking', 'toll', 'rapido', 'transport', 'commute', 'travel'
  ],
  'Shopping': [
    'amazon', 'flipkart', 'myntra', 'ajio', 'meesho', 'shopping', 'mall',
    'store', 'fashion', 'clothing', 'shoes', 'accessory', 'electronics',
    'gadget', 'purchase', 'order', 'buy', 'retail', 'nykaa', 'lifestyle'
  ],
  'Bills & Utilities': [
    'electricity', 'water', 'gas bill', 'internet', 'broadband', 'wifi',
    'mobile recharge', 'phone bill', 'dth', 'cable', 'utility', 'bill pay',
    'maintenance', 'society', 'jio', 'airtel', 'vi ', 'bsnl', 'postpaid',
    'prepaid'
  ],
  'Rent & Housing': [
    'rent', 'housing', 'lease', 'apartment', 'flat', 'accommodation',
    'landlord', 'pg ', 'hostel', 'room rent', 'house'
  ],
  'Health & Medical': [
    'hospital', 'doctor', 'medical', 'pharmacy', 'medicine', 'health',
    'clinic', 'diagnostic', 'lab', 'test', 'apollo', 'medplus', 'netmeds',
    'pharmeasy', 'dental', 'eye', 'gym', 'fitness'
  ],
  'Entertainment': [
    'netflix', 'spotify', 'hotstar', 'prime video', 'disney', 'youtube',
    'movie', 'cinema', 'theatre', 'concert', 'game', 'gaming', 'play',
    'subscription', 'ott', 'bookmyshow', 'event', 'party', 'club'
  ],
  'Education': [
    'education', 'course', 'tuition', 'school', 'college', 'university',
    'udemy', 'coursera', 'book', 'library', 'study', 'exam', 'class',
    'training', 'learn', 'certification', 'coaching'
  ],
  'Insurance & Tax': [
    'insurance premium', 'tax', 'gst', 'income tax',
    'emi', 'loan', 'credit card payment'
  ],
  'Cash Withdrawal': [
    'cash withdrawal', 'cash withdraw', 'atm wdl', 'cash wdl', 'atm withdrawal',
    'atm cash', 'nfs/atm', 'nfs atm', 'atm-cash', 'atm-wdl', 'self withdraw',
    'self withdrawal', 'cash-wdl', 'cash-withdrawal', 'branch cash', 'cwdr',
    'atw', 'atm debit', 'atm dispense', 'atm', 'withdrawal', 'wdl'
  ],
  'Transfers & Payments': [
    'transfer', 'upi', 'neft', 'rtgs', 'imps', 'payment', 'paytm',
    'phonepe', 'google pay', 'gpay', 'bhim', 'send money', 'received',
    'credited', 'debited'
  ],
  'Personal Care': [
    'salon', 'haircut', 'spa', 'beauty', 'grooming', 'cosmetic', 'skincare',
    'parlour', 'barber', 'laundry', 'dry clean'
  ]
};

// ───────── Chart Palette ─────────
const CHART_COLORS = [
  '#6366f1', '#a78bfa', '#22d3ee', '#34d399', '#fbbf24',
  '#f472b6', '#ef4444', '#f97316', '#84cc16', '#14b8a6',
  '#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#eab308',
  '#0ea5e9'
];

const WEEKLY_COLORS = [
  'rgba(99,102,241,.8)', 'rgba(167,139,250,.8)', 'rgba(34,211,238,.8)',
  'rgba(52,211,153,.8)', 'rgba(251,191,36,.8)', 'rgba(244,114,182,.8)'
];

const INVEST_COLORS = [
  '#a78bfa', '#6366f1', '#22d3ee', '#34d399', '#fbbf24', '#f472b6'
];

// ───────── Currency Formatter ─────────
function fmt(n) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.abs(n));
}

// ───────── Event Listeners ─────────

// Drag & Drop
uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadZone.classList.add('dragover');
});
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.classList.remove('dragover');
  if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
});
uploadZone.addEventListener('click', (e) => {
  if (e.target.id !== 'browse-btn') fileInput.click();
});
fileInput.addEventListener('change', () => {
  if (fileInput.files.length) handleFile(fileInput.files[0]);
});

// Remove file
removeFileBtn.addEventListener('click', () => {
  fileInput.value = '';
  rawRows = [];
  fileHeaders = [];
  allFileRows = [];
  fileInfo.classList.add('hidden');
  analyzeBtn.disabled = true;
});

// Config sync
function syncConfig() {
  const e = parseInt(expenseRange.value);
  const s = parseInt(savingsRange.value);
  const remaining = 100 - e - s;
  expenseInput.value = e;
  savingsInput.value = s;
  goalExpSeg.style.width = e + '%';
  goalExpSeg.textContent = 'Expenses ' + e + '%';
  goalSavSeg.style.width = s + '%';
  goalSavSeg.textContent = 'Savings ' + s + '%';
  goalInvSeg.style.width = Math.max(remaining, 0) + '%';
  goalInvSeg.textContent = remaining > 0 ? 'Invest ' + remaining + '%' : '';
}
expenseRange.addEventListener('input', syncConfig);
savingsRange.addEventListener('input', syncConfig);
expenseInput.addEventListener('change', () => { expenseRange.value = expenseInput.value; syncConfig(); });
savingsInput.addEventListener('change', () => { savingsRange.value = savingsInput.value; syncConfig(); });

// Analyze button
analyzeBtn.addEventListener('click', () => showColumnModal());

// Back button
backBtn.addEventListener('click', () => {
  dashboardSection.classList.add('hidden');
  recoSection.classList.add('hidden');
  aiSection.classList.add('hidden');
  uploadSection.classList.remove('hidden');
  updateNavActive('upload');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Nav links
$$('.nav-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const sec = link.dataset.section;
    if (sec === 'upload') {
      dashboardSection.classList.add('hidden');
      recoSection.classList.add('hidden');
      aiSection.classList.add('hidden');
      uploadSection.classList.remove('hidden');
      updateNavActive('upload');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (headerNav.classList.contains('open')) {
        headerNav.classList.remove('open');
        hamburgerBtn.classList.remove('active');
      }
      return;
    }
    const target = document.getElementById(sec + '-section');
    if (target && !target.classList.contains('hidden')) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
    // Close mobile menu
    if (headerNav.classList.contains('open')) {
      headerNav.classList.remove('open');
      hamburgerBtn.classList.remove('active');
    }
  });
});

// Modal
modalCancel.addEventListener('click', () => modalOverlay.classList.add('hidden'));
modalConfirm.addEventListener('click', () => {
  modalOverlay.classList.add('hidden');
  runAnalysis();
});

// Hamburger menu
hamburgerBtn.addEventListener('click', () => {
  hamburgerBtn.classList.toggle('active');
  headerNav.classList.toggle('open');
});

// ───────── Dark/Light Mode Toggle ─────────
const themeToggleBtn = $('#theme-toggle');
if (themeToggleBtn) {
  // Restore saved preference on page load
  const savedTheme = localStorage.getItem('spendwise-theme');
  if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
  }

  themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('spendwise-theme', isLight ? 'light' : 'dark');
  });
}

// ───────── Dropdown Hover Delay + Click Toggle Enhancement ─────────
// Keeps the dropdown open for 500ms after mouse leaves,
// and also supports click-to-toggle for reliable interaction.
const dropdownEl = document.querySelector('.dropdown');
const dropdownBtn = document.querySelector('.dropdown-toggle-btn');
if (dropdownEl && dropdownBtn) {
  let dropdownTimeout = null;

  // Hover: open immediately, close with 500ms delay
  dropdownEl.addEventListener('mouseenter', () => {
    if (dropdownTimeout) { clearTimeout(dropdownTimeout); dropdownTimeout = null; }
    dropdownEl.classList.add('dropdown-open');
  });

  dropdownEl.addEventListener('mouseleave', () => {
    dropdownTimeout = setTimeout(() => {
      dropdownEl.classList.remove('dropdown-open');
    }, 500);
  });

  // Click toggle: also opens/closes the dropdown on click
  dropdownBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (dropdownTimeout) { clearTimeout(dropdownTimeout); dropdownTimeout = null; }
    dropdownEl.classList.toggle('dropdown-open');
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!dropdownEl.contains(e.target)) {
      dropdownEl.classList.remove('dropdown-open');
    }
  });

  // Close dropdown when a dropdown item is clicked
  dropdownEl.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', () => {
      dropdownEl.classList.remove('dropdown-open');
    });
  });
}

// AI Key Input
aiKeyInput.addEventListener('input', () => {
  aiGenerateBtn.disabled = aiKeyInput.value.trim().length < 10;
});

// AI Key Toggle (show/hide)
aiKeyToggle.addEventListener('click', () => {
  const isPassword = aiKeyInput.type === 'password';
  aiKeyInput.type = isPassword ? 'text' : 'password';
  aiKeyToggle.title = isPassword ? 'Hide key' : 'Show key';
});

// AI Generate
aiGenerateBtn.addEventListener('click', () => generateAIRecommendations());
aiRetryBtn.addEventListener('click', () => generateAIRecommendations());
aiRegenerateBtn.addEventListener('click', () => generateAIRecommendations());

// ───────── File Handling ─────────
function handleFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (!['csv', 'xlsx', 'xls'].includes(ext)) {
    alert('Please upload a .csv or .xlsx file.');
    return;
  }
  fileName.textContent = file.name;
  fileInfo.classList.remove('hidden');

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      if (ext === 'csv') {
        parseCSV(e.target.result);
      } else {
        parseExcel(e.target.result);
      }
      analyzeBtn.disabled = false;
    } catch (err) {
      alert('Error reading file: ' + err.message);
    }
  };
  if (ext === 'csv') reader.readAsText(file);
  else reader.readAsArrayBuffer(file);
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) throw new Error('File appears empty.');
  allFileRows = lines.map(l => parseCSVLine(l));
  detectHeaderRow();
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; continue; }
    current += ch;
  }
  result.push(current.trim());
  return result;
}

function parseExcel(buffer) {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  if (json.length < 2) throw new Error('Sheet appears empty.');
  allFileRows = json.map(r => r.map(c => String(c).trim()));
  detectHeaderRow();
}

// ───────── Smart Header Detection ─────────
// Scans all rows to find the one that looks most like a table header.
// Bank statements often have customer info, bank name, address, account
// number, etc. in the first few rows before the actual transaction table.
function detectHeaderRow() {
  headerRowIndex = 0;
  let bestScore = 0;

  for (let i = 0; i < Math.min(allFileRows.length, 30); i++) {
    const row = allFileRows[i];
    if (!row || row.length < 3) continue; // Need at least 3 columns for a valid header

    const score = scoreHeaderRow(row);
    if (score > bestScore) {
      bestScore = score;
      headerRowIndex = i;
    }
  }

  fileHeaders = allFileRows[headerRowIndex].map(h => String(h).trim());
  rawRows = allFileRows.slice(headerRowIndex + 1)
    .map(r => r.map(c => String(c).trim()))
    .filter(r => r.some(cell => cell !== '')); // Remove fully empty rows
}

function scoreHeaderRow(row) {
  let score = 0;
  const cellTexts = row.map(c => String(c).toLowerCase().trim());

  // Check how many cells match known header keywords
  let matchCount = 0;
  const matchedKeywordTypes = new Set();

  for (const cell of cellTexts) {
    if (!cell) continue;
    for (const kw of HEADER_KEYWORDS) {
      if (cell.includes(kw) || kw.includes(cell)) {
        matchCount++;
        // Track which "type" of column this matches
        if (['date', 'txn date', 'transaction date', 'value date', 'posting date', 'txn_date'].some(d => cell.includes(d))) {
          matchedKeywordTypes.add('date');
        }
        if (['description', 'narration', 'particular', 'details', 'remark', 'narrative', 'memo', 'payee'].some(d => cell.includes(d))) {
          matchedKeywordTypes.add('desc');
        }
        if (['amount', 'debit', 'credit', 'withdrawal', 'deposit', 'dr', 'cr'].some(d => cell.includes(d))) {
          matchedKeywordTypes.add('amount');
        }
        break;
      }
    }
  }

  score += matchCount * 10;

  // Bonus: if the row matches multiple required column types (date + desc + amount), it's very likely a header
  if (matchedKeywordTypes.has('date')) score += 25;
  if (matchedKeywordTypes.has('desc')) score += 25;
  if (matchedKeywordTypes.has('amount')) score += 25;

  // Bonus for having multiple non-empty cells (headers usually have all columns filled)
  const nonEmpty = cellTexts.filter(c => c.length > 0).length;
  if (nonEmpty >= 3) score += nonEmpty * 2;

  // Penalty: if most cells look like numbers/dates (i.e., data rows, not headers)
  const numericCells = cellTexts.filter(c => /^[\d,.\-₹$€£\s\/]+$/.test(c) && c.length > 0).length;
  if (nonEmpty > 0 && numericCells / nonEmpty > 0.6) score -= 30;

  // Penalty: very few cells (likely a sparse info row like "Account: 12345")
  if (nonEmpty < 3) score -= 20;

  return score;
}

// ───────── Column Mapping Modal ─────────
function showColumnModal() {
  modalFields.innerHTML = '';

  // Show header detection info
  const banner = $('#header-detect-banner');
  const bannerText = $('#header-detect-text');
  if (headerRowIndex > 0) {
    banner.classList.remove('hidden');
    bannerText.textContent = `Skipped ${headerRowIndex} row(s) of customer/bank info. Header detected at row ${headerRowIndex + 1}: "${fileHeaders.slice(0, 4).join(', ')}${fileHeaders.length > 4 ? '...' : ''}"`;
  } else {
    banner.classList.remove('hidden');
    bannerText.textContent = `Header detected at row 1: "${fileHeaders.slice(0, 4).join(', ')}${fileHeaders.length > 4 ? '...' : ''}"`;
  }

  // Column mapping fields with expanded keyword matching
  const fields = [
    {
      id: 'col-date',
      label: 'Date Column',
      keywords: ['date', 'txn date', 'transaction date', 'value date', 'posting date', 'txn_date', 'trans date']
    },
    {
      id: 'col-desc',
      label: 'Description / Narration Column',
      keywords: ['description', 'narration', 'particular', 'details', 'remark', 'transaction', 'memo', 'payee', 'narrative', 'remarks', 'transaction details', 'txn description']
    },
    {
      id: 'col-debit',
      label: 'Withdrawal / Debit Column',
      keywords: ['debit', 'withdrawal', 'dr', 'debit amount', 'debit amt', 'withdrawl', 'spent', 'expense', 'withdrawal amt', 'withdrawal amount', 'dr.']
    },
    {
      id: 'col-credit',
      label: 'Deposit / Credit Column (optional)',
      keywords: ['credit', 'deposit', 'cr', 'credit amount', 'credit amt', 'income', 'cr.', 'deposit amount', 'deposit amt']
    },
    {
      id: 'col-amount',
      label: 'Combined Amount Column (if no separate debit/credit)',
      keywords: ['amount', 'transaction amount', 'txn amount', 'txn amt']
    }
  ];

  fields.forEach(f => {
    const div = document.createElement('div');
    div.className = 'modal-field';
    const label = document.createElement('label');
    label.textContent = f.label;
    label.setAttribute('for', f.id);
    const select = document.createElement('select');
    select.id = f.id;

    // "None" option for optional fields
    if (f.id === 'col-credit' || f.id === 'col-amount') {
      const opt0 = document.createElement('option');
      opt0.value = '-1';
      opt0.textContent = '— None / Not Available —';
      select.appendChild(opt0);
    }

    // Try to auto-detect the best column
    let bestIdx = -1;
    let bestMatchScore = 0;

    fileHeaders.forEach((h, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      // Show a preview of the first data value alongside the header name
      const preview = rawRows.length > 0 && rawRows[0][i] ? ` (e.g. "${rawRows[0][i]}")` : '';
      opt.textContent = (h || `Column ${i + 1}`) + preview;
      select.appendChild(opt);

      // Score this column against the field keywords
      const hLow = h.toLowerCase().trim();

      // For combined amount field, skip columns that are clearly debit or credit
      if (f.id === 'col-amount') {
        const debitCreditWords = ['debit', 'withdrawal', 'credit', 'deposit', 'dr', 'cr'];
        if (debitCreditWords.some(dcw => hLow.includes(dcw))) return; // skip this column
      }

      for (const kw of f.keywords) {
        // Exact match gets highest score
        if (hLow === kw) {
          if (10 > bestMatchScore) { bestMatchScore = 10; bestIdx = i; }
        }
        // Contains match
        else if (hLow.includes(kw) || kw.includes(hLow)) {
          const score = kw.length; // Longer keyword match = more specific
          if (score > bestMatchScore) { bestMatchScore = score; bestIdx = i; }
        }
      }
    });

    if (bestIdx !== -1) {
      select.value = bestIdx;
    } else if (f.id === 'col-credit' || f.id === 'col-amount') {
      select.value = '-1';
    }

    div.appendChild(label);
    div.appendChild(select);
    modalFields.appendChild(div);
  });

  modalOverlay.classList.remove('hidden');
}

// ───────── Run Analysis ─────────
function runAnalysis() {
  loadingOverlay.classList.remove('hidden');

  setTimeout(() => {
    const dateIdx = parseInt($('#col-date').value);
    const descIdx = parseInt($('#col-desc').value);
    const debitIdx = parseInt($('#col-debit').value);
    const creditIdx = parseInt($('#col-credit').value);
    const amountIdx = parseInt($('#col-amount').value);

    parsedData = [];
    rawRows.forEach(row => {
      const desc = (row[descIdx] || '').toString().trim();
      if (!desc) return;

      let debitVal = debitIdx >= 0 ? parseAmount(row[debitIdx]) : 0;
      let creditVal = creditIdx >= 0 ? parseAmount(row[creditIdx]) : 0;
      let amountVal = amountIdx >= 0 ? parseAmount(row[amountIdx]) : 0;

      const dateStr = (row[dateIdx] || '').toString().trim();

      // ── Strategy 1: Separate Debit & Credit columns ──
      if (debitIdx >= 0 && creditIdx >= 0) {
        if (debitVal !== 0) {
          parsedData.push({
            date: dateStr,
            description: desc,
            amount: Math.abs(debitVal),  // positive = expense
            parsedDate: smartParseDate(dateStr)
          });
        }
        if (creditVal !== 0) {
          parsedData.push({
            date: dateStr,
            description: desc,
            amount: -Math.abs(creditVal), // negative = income
            parsedDate: smartParseDate(dateStr)
          });
        }
        return;
      }

      // ── Strategy 2: Debit column only (no credit column) ──
      if (debitIdx >= 0 && creditIdx < 0 && amountIdx < 0) {
        if (debitVal !== 0) {
          parsedData.push({
            date: dateStr,
            description: desc,
            amount: Math.abs(debitVal),
            parsedDate: smartParseDate(dateStr)
          });
        }
        return;
      }

      // ── Strategy 3: Combined Amount column (with optional credit) ──
      if (amountIdx >= 0) {
        if (creditIdx >= 0 && creditVal !== 0) {
          parsedData.push({
            date: dateStr,
            description: desc,
            amount: -Math.abs(creditVal),
            parsedDate: smartParseDate(dateStr)
          });
        } else if (amountVal !== 0) {
          parsedData.push({
            date: dateStr,
            description: desc,
            amount: amountVal, // sign preserved for later auto-detect
            parsedDate: smartParseDate(dateStr)
          });
        }
        return;
      }

      // ── Strategy 4: Fallback — debit only ──
      if (debitVal !== 0) {
        parsedData.push({
          date: dateStr,
          description: desc,
          amount: Math.abs(debitVal),
          parsedDate: smartParseDate(dateStr)
        });
      }
    });

    if (parsedData.length === 0) {
      loadingOverlay.classList.add('hidden');
      alert('No valid transactions found. Please check your column mapping.');
      return;
    }

    // Auto-detect sign convention: positive = expense, negative = income
    // If most amounts are negative, flip them
    const negCount = parsedData.filter(d => d.amount < 0).length;
    const posCount = parsedData.filter(d => d.amount > 0).length;
    if (negCount > posCount * 2) {
      parsedData.forEach(d => d.amount = -d.amount);
    }

    // Categorize and tag investments
    parsedData.forEach(d => {
      d.isInvestment = d.amount > 0 && isInvestment(d.description);
      d.investmentType = d.isInvestment ? getInvestmentType(d.description) : null;
      d.category = d.isInvestment ? 'Investment' : categorize(d.description);
    });

    renderDashboard();
    loadingOverlay.classList.add('hidden');
  }, 600);
}

function parseAmount(val) {
  if (val === undefined || val === null || val === '') return 0;
  // Remove currency symbols, commas, spaces, and handle parenthetical negatives
  let str = String(val).trim();
  // Handle (1234.56) as negative
  const isParenNeg = /^\(.*\)$/.test(str);
  str = str.replace(/[₹$€£,\s()]/g, '');
  // Handle "Dr" / "Cr" suffixes
  const isDr = /dr\.?$/i.test(str);
  const isCr = /cr\.?$/i.test(str);
  str = str.replace(/(dr|cr)\.?$/i, '').trim();
  const n = parseFloat(str);
  if (isNaN(n)) return 0;
  if (isParenNeg || isDr) return Math.abs(n);
  if (isCr) return -Math.abs(n);
  return n;
}

// Smart date parser: handles DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, DD-Mon-YYYY,
// Excel serial dates (5-digit numbers), and trailing junk chars from XLS files.
function smartParseDate(dateStr) {
  if (!dateStr) return null;
  let s = String(dateStr).trim();

  // Strip trailing non-date characters (real bank XLS files append random chars like "02/07/2026c" or "26/07/20269")
  // First strip trailing letters/symbols
  s = s.replace(/[a-zA-Z!@#$%^&*()_\[\]{}|\\;'"<>?]+$/, '').trim();
  // Then fix dates where extra digits are appended after a 4-digit year: "26/07/20269" → "26/07/2026"
  s = s.replace(/^(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})\d+$/, '$1');

  if (!s) return null;

  // Excel serial date number (e.g. 46205 = a date in 2026)
  if (/^\d{4,5}(\.\d+)?$/.test(s)) {
    const serial = parseFloat(s);
    if (serial > 30000 && serial < 60000) {
      // Excel epoch: Jan 1, 1900 (with the 1900 leap year bug)
      const excelEpoch = new Date(1899, 11, 30);
      const d = new Date(excelEpoch.getTime() + serial * 86400000);
      if (!isNaN(d.getTime()) && d.getFullYear() > 1990) return d;
    }
  }

  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY (MUST come BEFORE native Date!)
  const dmy = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (dmy) {
    let [, day, month, year] = dmy;
    day = parseInt(day); month = parseInt(month); year = parseInt(year);
    if (year < 100) year += 2000;
    // Heuristic: if day > 12, it's definitely DD/MM format
    // If month > 12, it's MM/DD format
    // Otherwise assume DD/MM (standard in India/EU)
    if (month > 12 && day <= 12) {
      // Swap — it's actually MM/DD/YYYY
      [day, month] = [month, day];
    }
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      const d = new Date(year, month - 1, day);
      if (!isNaN(d.getTime())) return d;
    }
  }

  // YYYY-MM-DD (ISO format)
  const iso = s.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/);
  if (iso) {
    const [, year, month, day] = iso;
    const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(d.getTime())) return d;
  }

  // DD-Mon-YYYY or DD Mon YYYY (e.g. "15-Sep-2026" or "15 Sep 2026")
  const dMonY = s.match(/^(\d{1,2})[\-\s]([A-Za-z]{3,})[\-\s](\d{2,4})$/);
  if (dMonY) {
    let [, day, mon, year] = dMonY;
    if (year.length === 2) year = '20' + year;
    const d = new Date(`${mon} ${day}, ${year}`);
    if (!isNaN(d.getTime())) return d;
  }

  // Mon DD, YYYY (e.g. "Sep 15, 2026")
  const monDY = s.match(/^([A-Za-z]{3,})\s+(\d{1,2}),?\s+(\d{4})$/);
  if (monDY) {
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d;
  }

  // Last resort: native Date constructor (only for formats not handled above)
  const d = new Date(s);
  if (!isNaN(d.getTime()) && d.getFullYear() > 1990) return d;

  return null;
}

function categorize(desc) {
  const d = desc.toLowerCase();
  if (d.includes('cashback') || d.includes('cash back')) {
    if (CATEGORIES['Transfers & Payments'].some(kw => d.includes(kw))) {
      return 'Transfers & Payments';
    }
    return 'Other';
  }
  for (const [cat, keywords] of Object.entries(CATEGORIES)) {
    if (keywords.some(kw => d.includes(kw))) return cat;
  }
  return 'Other';
}

// ───────── Render Dashboard ─────────
function renderDashboard() {
  // Split income vs expense vs investment
  const investments = parsedData.filter(d => d.isInvestment);
  const expenses = parsedData.filter(d => d.amount > 0 && !d.isInvestment);
  const incomes = parsedData.filter(d => d.amount < 0);

  const totalInvestment = investments.reduce((s, d) => s + d.amount, 0);
  const totalExpense = expenses.reduce((s, d) => s + d.amount, 0);
  const totalIncome = incomes.reduce((s, d) => s + Math.abs(d.amount), 0);
  const netSavings = totalIncome - totalExpense - totalInvestment;

  // KPIs
  $('#kpi-income').textContent = fmt(totalIncome || (totalExpense + totalInvestment));
  $('#kpi-expense').textContent = fmt(totalExpense);
  $('#kpi-invest').textContent = fmt(totalInvestment);
  $('#kpi-savings').textContent = fmt(netSavings);
  $('#kpi-txn').textContent = parsedData.length;

  // Category aggregation (expenses only — investments excluded)
  const catMap = {};
  expenses.forEach(d => {
    if (!catMap[d.category]) catMap[d.category] = { total: 0, count: 0 };
    catMap[d.category].total += d.amount;
    catMap[d.category].count++;
  });
  const catEntries = Object.entries(catMap).sort((a, b) => b[1].total - a[1].total);

  // Goal progress
  const targetExpPct = parseInt(expenseRange.value);
  const targetSavPct = parseInt(savingsRange.value);
  const income = totalIncome || (totalExpense + totalInvestment);
  const actualExpPct = income > 0 ? (totalExpense / income) * 100 : 0;
  const actualSavPct = income > 0 ? (netSavings / income) * 100 : 0;

  renderProgressBars(targetExpPct, actualExpPct, targetSavPct, actualSavPct);
  renderCharts(catEntries, totalExpense);
  renderPeriodSpending(expenses);
  renderTopExpenses(expenses);
  renderCategoryTable(catEntries, totalExpense);
  renderInvestmentSummary(investments, totalInvestment, income);
  renderRecommendations(catEntries, totalExpense, totalIncome, netSavings, targetExpPct, targetSavPct, totalInvestment);

  // Store analysis state for AI
  analysisState = {
    totalIncome: income,
    totalExpense,
    totalInvestment,
    netSavings,
    catEntries,
    investments,
    targetExpPct,
    targetSavPct,
    actualExpPct,
    actualSavPct,
    investPct: income > 0 ? (totalInvestment / income * 100) : 0,
    savingsPct: income > 0 ? (netSavings / income * 100) : 0
  };

  // Show sections
  uploadSection.classList.add('hidden');
  dashboardSection.classList.remove('hidden');
  recoSection.classList.remove('hidden');
  aiSection.classList.remove('hidden');
  updateNavActive('dashboard');

  // Animate in
  $$('.kpi-card, .card--progress, .card--chart, .card--table, .card--weekly, .card--investment, .reco-card').forEach((el, i) => {
    el.style.animationDelay = (i * 0.07) + 's';
    el.classList.add('fade-in');
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ───────── Progress Bars ─────────
function renderProgressBars(targetExp, actualExp, targetSav, actualSav) {
  const container = $('#progress-bars');
  container.innerHTML = '';

  const bars = [
    {
      label: 'Expense Ratio',
      actual: actualExp,
      target: targetExp,
      suffix: '% of income',
      invert: true
    },
    {
      label: 'Savings Rate',
      actual: Math.max(actualSav, 0),
      target: targetSav,
      suffix: '% of income',
      invert: false
    }
  ];

  bars.forEach(b => {
    const pct = Math.min(b.actual, 100);
    let status;
    if (b.invert) {
      status = b.actual <= b.target ? 'good' : b.actual <= b.target * 1.2 ? 'warn' : 'danger';
    } else {
      status = b.actual >= b.target ? 'good' : b.actual >= b.target * 0.7 ? 'warn' : 'danger';
    }

    const div = document.createElement('div');
    div.className = 'progress-item';
    div.innerHTML = `
      <div class="progress-header">
        <span class="progress-label">${b.label}</span>
        <span class="progress-values">${b.actual.toFixed(1)}${b.suffix} (Target: ${b.target}%)</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill ${status}" style="width:${pct}%"></div>
      </div>
    `;
    container.appendChild(div);
  });
}

// ───────── Charts ─────────
function renderCharts(catEntries, totalExpense) {
  const labels = catEntries.map(([cat]) => cat);
  const data = catEntries.map(([, v]) => v.total);
  const colors = catEntries.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]);

  // Destroy old charts
  if (pieChart) pieChart.destroy();
  if (barChart) barChart.destroy();

  const defaultOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#94a3b8',
          font: { family: "'Inter', sans-serif", size: 11 },
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 10
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17,24,39,.92)',
        titleFont: { family: "'Inter', sans-serif", weight: '600' },
        bodyFont: { family: "'Inter', sans-serif" },
        borderColor: 'rgba(99,102,241,.3)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          label: (ctx) => {
            const val = ctx.parsed || ctx.parsed.y || ctx.raw;
            const pct = ((val / totalExpense) * 100).toFixed(1);
            return ` ${ctx.label}: ${fmt(val)} (${pct}%)`;
          }
        }
      }
    }
  };

  // Pie / Doughnut
  pieChart = new Chart($('#pie-chart'), {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderColor: 'rgba(10,14,26,.6)',
        borderWidth: 2,
        hoverOffset: 12
      }]
    },
    options: {
      ...defaultOpts,
      cutout: '55%',
      plugins: {
        ...defaultOpts.plugins,
        tooltip: {
          ...defaultOpts.plugins.tooltip,
          callbacks: {
            label: (ctx) => {
              const pct = ((ctx.raw / totalExpense) * 100).toFixed(1);
              return ` ${ctx.label}: ${fmt(ctx.raw)} (${pct}%)`;
            }
          }
        }
      }
    }
  });

  // Bar
  barChart = new Chart($('#bar-chart'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Amount Spent',
        data,
        backgroundColor: colors.map(c => c + 'cc'),
        borderColor: colors,
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      ...defaultOpts,
      indexAxis: 'y',
      plugins: {
        ...defaultOpts.plugins,
        legend: { display: false },
        tooltip: {
          ...defaultOpts.plugins.tooltip,
          callbacks: {
            label: (ctx) => ` ${fmt(ctx.raw)}`
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,.04)' },
          ticks: { color: '#64748b', font: { family: "'Inter', sans-serif", size: 11 }, callback: (v) => fmt(v) }
        },
        y: {
          grid: { display: false },
          ticks: { color: '#94a3b8', font: { family: "'Inter', sans-serif", size: 11, weight: '500' } }
        }
      }
    }
  });
}

// ───────── Period Spending (Auto: Weekly or Monthly) ─────────

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function formatDateShort(date) {
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
}

function formatDateFull(date) {
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

// Determine whether to use weekly or monthly grouping
function getPeriodData(expenses) {
  const expensesWithDates = expenses.filter(d => d.parsedDate);

  if (expensesWithDates.length === 0) {
    // Fallback: group by transaction order (every 7 txns)
    return { mode: 'weekly', buckets: getFallbackBuckets(expenses) };
  }

  expensesWithDates.sort((a, b) => a.parsedDate - b.parsedDate);
  const firstDate = expensesWithDates[0].parsedDate;
  const lastDate = expensesWithDates[expensesWithDates.length - 1].parsedDate;
  const daySpan = Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24)) + 1;

  // If data spans more than ~45 days, use monthly; otherwise weekly
  if (daySpan > 45) {
    return { mode: 'monthly', buckets: getMonthlyBuckets(expensesWithDates, firstDate, lastDate) };
  } else {
    return { mode: 'weekly', buckets: getWeeklyBuckets(expensesWithDates, firstDate, lastDate) };
  }
}

function getFallbackBuckets(expenses) {
  const buckets = [];
  for (let i = 0; i < expenses.length; i += 7) {
    const chunk = expenses.slice(i, i + 7);
    const total = chunk.reduce((s, d) => s + d.amount, 0);
    const catMap = {};
    chunk.forEach(d => { catMap[d.category] = (catMap[d.category] || 0) + d.amount; });
    const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Other';
    buckets.push({
      label: `Group ${buckets.length + 1}`,
      period: `${chunk[0]?.date || '?'} – ${chunk[chunk.length - 1]?.date || '?'}`,
      total,
      count: chunk.length,
      topCategory: topCat,
      days: 7
    });
  }
  return buckets;
}

function getWeeklyBuckets(expenses, firstDate, lastDate) {
  // Start from the Monday on or before firstDate
  const startDay = new Date(firstDate);
  startDay.setDate(startDay.getDate() - ((startDay.getDay() + 6) % 7));
  startDay.setHours(0, 0, 0, 0);

  const buckets = [];
  let weekStart = new Date(startDay);

  while (weekStart <= lastDate) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const filtered = expenses.filter(d => d.parsedDate >= weekStart && d.parsedDate <= weekEnd);
    if (filtered.length > 0) {
      const total = filtered.reduce((s, d) => s + d.amount, 0);
      const catMap = {};
      filtered.forEach(d => { catMap[d.category] = (catMap[d.category] || 0) + d.amount; });
      const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Other';

      buckets.push({
        label: `Week ${buckets.length + 1}`,
        period: `${formatDateShort(weekStart)} – ${formatDateShort(weekEnd)}`,
        total,
        count: filtered.length,
        topCategory: topCat,
        days: 7
      });
    }

    weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() + 1);
    weekStart.setHours(0, 0, 0, 0);
  }

  return buckets;
}

function getMonthlyBuckets(expenses, firstDate, lastDate) {
  const buckets = [];
  let year = firstDate.getFullYear();
  let month = firstDate.getMonth();

  while (year < lastDate.getFullYear() || (year === lastDate.getFullYear() && month <= lastDate.getMonth())) {
    const monthStart = new Date(year, month, 1, 0, 0, 0, 0);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999); // Last day of month

    const filtered = expenses.filter(d => d.parsedDate >= monthStart && d.parsedDate <= monthEnd);
    if (filtered.length > 0) {
      const total = filtered.reduce((s, d) => s + d.amount, 0);
      const catMap = {};
      filtered.forEach(d => { catMap[d.category] = (catMap[d.category] || 0) + d.amount; });
      const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Other';
      const daysInMonth = monthEnd.getDate();

      buckets.push({
        label: `${MONTHS_SHORT[month]} ${year}`,
        period: `1 ${MONTHS_SHORT[month]} – ${daysInMonth} ${MONTHS_SHORT[month]} ${year}`,
        total,
        count: filtered.length,
        topCategory: topCat,
        days: daysInMonth
      });
    }

    month++;
    if (month > 11) { month = 0; year++; }
  }

  return buckets;
}

function renderPeriodSpending(expenses) {
  const { mode, buckets } = getPeriodData(expenses);

  // Update DOM titles based on mode
  const chartTitle = $('#period-chart-title');
  const tableTitle = $('#period-table-title');
  const svgIcon = chartTitle.querySelector('svg');
  const isMonthly = mode === 'monthly';

  // Set the text (keep the SVG icon)
  chartTitle.innerHTML = '';
  if (svgIcon) chartTitle.appendChild(svgIcon);
  chartTitle.appendChild(document.createTextNode(isMonthly ? ' Monthly Spending Overview' : ' Weekly Spending Overview'));
  tableTitle.textContent = isMonthly ? 'Monthly Breakdown' : 'Weekly Breakdown';

  // Destroy old chart
  if (weeklyChart) weeklyChart.destroy();

  const labels = buckets.map(b => b.label);
  const data = buckets.map(b => b.total);
  const colors = buckets.map((_, i) => WEEKLY_COLORS[i % WEEKLY_COLORS.length]);
  const avgSpend = data.length > 0 ? data.reduce((s, v) => s + v, 0) / data.length : 0;

  weeklyChart = new Chart($('#period-chart'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: isMonthly ? 'Monthly Spend' : 'Weekly Spend',
          data,
          backgroundColor: colors,
          borderColor: colors.map(c => c.replace('.8)', '1)')),
          borderWidth: 1,
          borderRadius: 8,
          borderSkipped: false
        },
        {
          label: 'Average',
          data: data.map(() => avgSpend),
          type: 'line',
          borderColor: '#f472b6',
          borderDash: [6, 4],
          borderWidth: 2,
          pointRadius: 0,
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#94a3b8',
            font: { family: "'Inter', sans-serif", size: 11 },
            padding: 16,
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: 'rgba(17,24,39,.92)',
          titleFont: { family: "'Inter', sans-serif", weight: '600' },
          bodyFont: { family: "'Inter', sans-serif" },
          borderColor: 'rgba(99,102,241,.3)',
          borderWidth: 1,
          cornerRadius: 8,
          padding: 12,
          callbacks: {
            label: (ctx) => {
              if (ctx.dataset.label === 'Average') return ` Avg: ${fmt(ctx.raw)}`;
              const b = buckets[ctx.dataIndex];
              return [
                ` Spent: ${fmt(ctx.raw)}`,
                ` Transactions: ${b.count}`,
                ` Top: ${b.topCategory}`
              ];
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#94a3b8', font: { family: "'Inter', sans-serif", size: 12, weight: '600' } }
        },
        y: {
          grid: { color: 'rgba(255,255,255,.04)' },
          ticks: { color: '#64748b', font: { family: "'Inter', sans-serif", size: 11 }, callback: (v) => fmt(v) }
        }
      }
    }
  });

  // Render table
  const tbody = $('#period-body');
  tbody.innerHTML = '';
  buckets.forEach(b => {
    const dailyAvg = b.total / b.days;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight:700; color:var(--accent-2);">${b.label}</td>
      <td>${b.period}</td>
      <td>${b.count}</td>
      <td style="font-weight:600;">${fmt(b.total)}</td>
      <td>${fmt(dailyAvg)}</td>
      <td><span class="cat-tag" style="background:${CHART_COLORS[Object.keys(CATEGORIES).indexOf(b.topCategory) % CHART_COLORS.length]}22; color:${CHART_COLORS[Object.keys(CATEGORIES).indexOf(b.topCategory) % CHART_COLORS.length]}">${b.topCategory}</span></td>
    `;
    tbody.appendChild(tr);
  });

  return { mode, buckets };
}

// ───────── Top Expenses Table ─────────
function renderTopExpenses(expenses) {
  const sorted = [...expenses].sort((a, b) => b.amount - a.amount).slice(0, 15);
  const tbody = $('#top-expenses-body');
  tbody.innerHTML = '';
  sorted.forEach((tx, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${tx.date}</td>
      <td style="max-width:260px; overflow:hidden; text-overflow:ellipsis;">${tx.description}</td>
      <td><span class="cat-tag" style="background:${CHART_COLORS[Object.keys(CATEGORIES).indexOf(tx.category) % CHART_COLORS.length]}22; color:${CHART_COLORS[Object.keys(CATEGORIES).indexOf(tx.category) % CHART_COLORS.length]}">${tx.category}</span></td>
      <td style="font-weight:600;">${fmt(tx.amount)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ───────── Category Summary Table ─────────
function renderCategoryTable(catEntries, totalExpense) {
  const tbody = $('#category-body');
  tbody.innerHTML = '';
  catEntries.forEach(([cat, v]) => {
    const pct = ((v.total / totalExpense) * 100).toFixed(1);
    const avg = v.total / v.count;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight:600;">${cat}</td>
      <td>${v.count}</td>
      <td style="font-weight:600;">${fmt(v.total)}</td>
      <td>${pct}%</td>
      <td>${fmt(avg)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ───────── Investment Summary ─────────
function renderInvestmentSummary(investments, totalInvestment, income) {
  const tbody = $('#investment-body');
  const totalEl = $('#investment-total');
  tbody.innerHTML = '';

  if (investments.length === 0) {
    $('#investment-card').style.display = 'none';
    return;
  }

  $('#investment-card').style.display = '';

  // Table
  investments.forEach(inv => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${inv.date}</td>
      <td style="max-width:240px; overflow:hidden; text-overflow:ellipsis;">${inv.description}</td>
      <td><span class="cat-tag" style="background:rgba(99,102,241,.15); color:#a78bfa;">${inv.investmentType}</span></td>
      <td style="font-weight:600; color:var(--accent-2);">${fmt(inv.amount)}</td>
    `;
    tbody.appendChild(tr);
  });

  // Total
  const pctOfIncome = income > 0 ? ((totalInvestment / income) * 100).toFixed(1) : '0.0';
  totalEl.innerHTML = `
    <span>Total Investments</span>
    <span style="color:var(--accent-2);">${fmt(totalInvestment)} <span style="font-size:.8rem; color:var(--text-muted);">(${pctOfIncome}% of income)</span></span>
  `;

  // Mini doughnut chart for investment breakdown
  if (investChart) investChart.destroy();

  const typeMap = {};
  investments.forEach(inv => {
    if (!typeMap[inv.investmentType]) typeMap[inv.investmentType] = 0;
    typeMap[inv.investmentType] += inv.amount;
  });
  const typeEntries = Object.entries(typeMap).sort((a, b) => b[1] - a[1]);

  investChart = new Chart($('#investment-chart'), {
    type: 'doughnut',
    data: {
      labels: typeEntries.map(([t]) => t),
      datasets: [{
        data: typeEntries.map(([, v]) => v),
        backgroundColor: typeEntries.map((_, i) => INVEST_COLORS[i % INVEST_COLORS.length]),
        borderColor: 'rgba(10,14,26,.6)',
        borderWidth: 2,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#94a3b8',
            font: { family: "'Inter', sans-serif", size: 11 },
            padding: 10,
            usePointStyle: true,
            pointStyleWidth: 8
          }
        },
        tooltip: {
          backgroundColor: 'rgba(17,24,39,.92)',
          titleFont: { family: "'Inter', sans-serif", weight: '600' },
          bodyFont: { family: "'Inter', sans-serif" },
          borderColor: 'rgba(99,102,241,.3)',
          borderWidth: 1,
          cornerRadius: 8,
          padding: 12,
          callbacks: {
            label: (ctx) => {
              const pct = ((ctx.raw / totalInvestment) * 100).toFixed(1);
              return ` ${ctx.label}: ${fmt(ctx.raw)} (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

// ───────── Recommendations Engine ─────────
function renderRecommendations(catEntries, totalExpense, totalIncome, netSavings, targetExpPct, targetSavPct, totalInvestment) {
  const grid = $('#reco-grid');
  grid.innerHTML = '';
  const recommendations = [];
  const income = totalIncome || (totalExpense + totalInvestment);

  // Build category percentage map
  const catPctMap = {};
  catEntries.forEach(([cat, v]) => {
    catPctMap[cat] = (v.total / totalExpense) * 100;
  });

  // 1. Overall spending check
  const actualExpPct = (totalExpense / income) * 100;
  if (actualExpPct > targetExpPct) {
    const overBy = actualExpPct - targetExpPct;
    recommendations.push({
      type: 'cut',
      title: 'Spending Exceeds Target',
      text: `Your expenses are ${overBy.toFixed(1)}% above your ${targetExpPct}% target. You're spending ${fmt(totalExpense)} against an ideal of ${fmt(income * targetExpPct / 100)}. Consider reviewing your top spending categories to identify areas to cut back.`,
      amount: `Overspent by ${fmt(totalExpense - income * targetExpPct / 100)}`
    });
  } else {
    recommendations.push({
      type: 'save',
      title: 'Great Job on Spending!',
      text: `Your expenses are within your target at ${actualExpPct.toFixed(1)}% of income. You're ${(targetExpPct - actualExpPct).toFixed(1)}% below your limit. Keep up the discipline!`,
      amount: `Under budget by ${fmt(income * targetExpPct / 100 - totalExpense)}`
    });
  }

  // 2. Savings check
  const actualSavPct = (netSavings / income) * 100;
  if (actualSavPct < targetSavPct) {
    recommendations.push({
      type: 'save',
      title: 'Boost Your Savings',
      text: `You're saving ${actualSavPct.toFixed(1)}% of your income, which is below your ${targetSavPct}% goal. Try to reduce discretionary spending by at least ${fmt(income * (targetSavPct - actualSavPct) / 100)} to hit your target.`,
      amount: `Gap: ${fmt(income * targetSavPct / 100 - Math.max(netSavings, 0))}`
    });
  } else if (netSavings > 0) {
    recommendations.push({
      type: 'invest',
      title: 'You Have Surplus — Consider Investing',
      text: `You've saved ${fmt(netSavings)} (${actualSavPct.toFixed(1)}% of income), exceeding your ${targetSavPct}% target! Consider putting the surplus of ${fmt(netSavings - income * targetSavPct / 100)} into index funds, SIPs, or a high-yield savings account.`,
      amount: `Investable surplus: ${fmt(Math.max(netSavings - income * targetSavPct / 100, 0))}`
    });
  }

  // 3. Period spending pattern (weekly or monthly)
  const expensesOnly = parsedData.filter(d => d.amount > 0 && !d.isInvestment);
  const { mode: periodMode, buckets: periodBuckets } = getPeriodData(expensesOnly);
  if (periodBuckets.length >= 2) {
    const totals = periodBuckets.map(b => b.total);
    const maxVal = Math.max(...totals);
    const avgVal = totals.reduce((s, v) => s + v, 0) / totals.length;
    const highestBucket = periodBuckets.find(b => b.total === maxVal);
    const periodLabel = periodMode === 'monthly' ? 'month' : 'week';

    if (maxVal > avgVal * 1.3) {
      recommendations.push({
        type: 'tip',
        title: `Uneven ${periodMode === 'monthly' ? 'Monthly' : 'Weekly'} Spending`,
        text: `${highestBucket.label} (${highestBucket.period}) was your highest spending ${periodLabel} at ${fmt(maxVal)}, which is ${((maxVal / avgVal - 1) * 100).toFixed(0)}% above your ${periodLabel}ly average of ${fmt(avgVal)}. Try to spread expenses more evenly for better budgeting.`,
        amount: `${periodMode === 'monthly' ? 'Monthly' : 'Weekly'} average: ${fmt(avgVal)}`
      });
    }
  }

  // 4. Food & Dining check
  if (catPctMap['Food & Dining'] > 20) {
    const foodTotal = catEntries.find(([c]) => c === 'Food & Dining')?.[1].total || 0;
    recommendations.push({
      type: 'cut',
      title: 'High Food & Dining Expenses',
      text: `Food & Dining accounts for ${catPctMap['Food & Dining'].toFixed(1)}% of your spending (${fmt(foodTotal)}). Consider meal prepping, reducing takeout orders, and cooking at home to save up to 40% on food costs.`,
      amount: `Potential savings: ${fmt(foodTotal * 0.3)}`
    });
  }

  // 5. Shopping check
  if (catPctMap['Shopping'] > 15) {
    const shopTotal = catEntries.find(([c]) => c === 'Shopping')?.[1].total || 0;
    recommendations.push({
      type: 'cut',
      title: 'Reduce Impulse Shopping',
      text: `Shopping makes up ${catPctMap['Shopping'].toFixed(1)}% of expenses (${fmt(shopTotal)}). Try the 48-hour rule — wait 2 days before making non-essential purchases. Unsubscribe from marketing emails and use wish lists instead of instant buying.`,
      amount: `Potential savings: ${fmt(shopTotal * 0.35)}`
    });
  }

  // 6. Entertainment
  if (catPctMap['Entertainment'] > 10) {
    const entTotal = catEntries.find(([c]) => c === 'Entertainment')?.[1].total || 0;
    recommendations.push({
      type: 'cut',
      title: 'Optimize Entertainment Spending',
      text: `Entertainment is at ${catPctMap['Entertainment'].toFixed(1)}% (${fmt(entTotal)}). Review your subscriptions — cancel unused ones and consider sharing family plans. Look for free or low-cost entertainment options in your area.`,
      amount: `Potential savings: ${fmt(entTotal * 0.4)}`
    });
  }

  // 7. Transport
  if (catPctMap['Transport'] > 12) {
    const transTotal = catEntries.find(([c]) => c === 'Transport')?.[1].total || 0;
    recommendations.push({
      type: 'tip',
      title: 'Optimize Transport Costs',
      text: `Transport costs are ${catPctMap['Transport'].toFixed(1)}% of spending (${fmt(transTotal)}). Consider carpooling, using public transit, or cycling for short trips. If using ride-hailing, compare prices across apps and prefer pool rides.`,
      amount: `Potential savings: ${fmt(transTotal * 0.25)}`
    });
  }

  // 8. Bills & Utilities
  if (catPctMap['Bills & Utilities'] > 10) {
    const billTotal = catEntries.find(([c]) => c === 'Bills & Utilities')?.[1].total || 0;
    recommendations.push({
      type: 'tip',
      title: 'Review Utility Bills',
      text: `Utilities cost ${fmt(billTotal)} (${catPctMap['Bills & Utilities'].toFixed(1)}%). Review your mobile and internet plans — you might be overpaying. Switch to energy-efficient appliances and consider prepaid plans for better rates.`,
      amount: `Potential savings: ${fmt(billTotal * 0.15)}`
    });
  }

  // 9. Investment recommendation
  const investPct = 100 - targetExpPct - targetSavPct;
  if (investPct > 0 && netSavings > 0) {
    const idealInvest = income * investPct / 100;
    recommendations.push({
      type: 'invest',
      title: 'Start Building Wealth',
      text: `Based on your ${investPct}% investment goal, you should be allocating about ${fmt(idealInvest)} monthly towards investments. Consider a diversified portfolio: 60% equity mutual funds/SIPs, 25% fixed deposits/bonds, and 15% gold or REITs.`,
      amount: `Monthly investment target: ${fmt(idealInvest)}`
    });
  }

  // 10. Existing investment acknowledgment
  if (totalInvestment > 0) {
    recommendations.push({
      type: 'invest',
      title: 'Your Current Investments',
      text: `Great! You're already investing ${fmt(totalInvestment)} this month (${(totalInvestment / income * 100).toFixed(1)}% of income). This includes LIC premiums, mutual fund SIPs, and other instruments. These have been separated from your expenses for a clearer financial picture.`,
      amount: `Current investment: ${fmt(totalInvestment)}`
    });
  }

  // 11. Emergency fund
  if (netSavings > 0) {
    recommendations.push({
      type: 'save',
      title: 'Build an Emergency Fund',
      text: `Aim to have 3-6 months of expenses (${fmt(totalExpense * 3)} – ${fmt(totalExpense * 6)}) in a liquid fund. This protects you against unexpected job loss, medical emergencies, or major repairs without going into debt.`,
      amount: `Target: ${fmt(totalExpense * 6)}`
    });
  }

  // 12. Top spending category insight
  if (catEntries.length > 0) {
    const [topCat, topVal] = catEntries[0];
    recommendations.push({
      type: 'tip',
      title: `${topCat}: Your Biggest Expense`,
      text: `${topCat} is your largest spending category at ${((topVal.total / totalExpense) * 100).toFixed(1)}% of total expenses (${fmt(topVal.total)} across ${topVal.count} transactions). Tracking this category closely each week can help you stay within budget.`,
      amount: `Avg. per transaction: ${fmt(topVal.total / topVal.count)}`
    });
  }

  // Render cards
  recommendations.forEach((r, i) => {
    const card = document.createElement('div');
    card.className = `reco-card reco--${r.type}`;
    card.style.animationDelay = (i * 0.08) + 's';
    card.classList.add('fade-in');
    const badgeText = r.type === 'cut' ? '✂ Cut Costs' : r.type === 'save' ? '💰 Save More' : r.type === 'invest' ? '📈 Invest' : '💡 Smart Tip';
    card.innerHTML = `
      <span class="reco-badge">${badgeText}</span>
      <h4 class="reco-title">${r.title}</h4>
      <p class="reco-text">${r.text}</p>
      ${r.amount ? `<span class="reco-amount">${r.amount}</span>` : ''}
    `;
    grid.appendChild(card);
  });
}

// ───────── AI Integration (Google Gemini Flash) ─────────

let activeRiskFilter = 'all';
let currentAiRecommendations = [];

async function generateAIRecommendations() {
  const apiKey = aiKeyInput.value.trim();
  if (!apiKey) {
    alert('Please enter your Gemini API key.');
    return;
  }

  if (!analysisState.totalIncome) {
    alert('Please analyze a statement first.');
    return;
  }

  // Show loading, hide results/error
  aiLoading.classList.remove('hidden');
  aiResults.classList.add('hidden');
  aiError.classList.add('hidden');
  aiGenerateBtn.disabled = true;

  try {
    const prompt = buildFinancialPrompt();
    const response = await callGeminiAPI(apiKey, prompt);
    const recommendations = parseAIResponse(response);
    currentAiRecommendations = recommendations;
    renderAIRecommendations(recommendations);

    aiLoading.classList.add('hidden');
    aiResults.classList.remove('hidden');
  } catch (err) {
    console.error('AI API Error:', err);
    aiLoading.classList.add('hidden');
    aiError.classList.remove('hidden');
    aiErrorMsg.textContent = err.message || 'Something went wrong. Please check your API key and try again.';
  } finally {
    aiGenerateBtn.disabled = false;
  }
}

function buildFinancialPrompt() {
  const s = analysisState;

  // Build category breakdown string
  const catBreakdown = s.catEntries
    .map(([cat, v]) => `- ${cat}: ₹${v.total.toLocaleString('en-IN')} (${((v.total / s.totalExpense) * 100).toFixed(1)}%)`)
    .join('\n');

  // Build investment breakdown string
  const investBreakdown = s.investments.length > 0
    ? s.investments.map(inv => `- ${inv.investmentType}: ₹${inv.amount.toLocaleString('en-IN')} (${inv.description})`).join('\n')
    : 'No current investments detected.';

  return `You are an expert Indian financial advisor. Analyze the following monthly financial summary and expense patterns, then produce completely dynamic, personalized investment and spending recommendations.

## User's Uploaded Financial Profile (Monthly)
- **Monthly Income**: ₹${s.totalIncome.toLocaleString('en-IN')}
- **Total Expenses**: ₹${s.totalExpense.toLocaleString('en-IN')} (${s.actualExpPct.toFixed(1)}% of income)
- **Total Investments**: ₹${s.totalInvestment.toLocaleString('en-IN')} (${s.investPct.toFixed(1)}% of income)
- **Net Monthly Surplus / Savings**: ₹${Math.max(s.netSavings, 0).toLocaleString('en-IN')} (${Math.max(s.savingsPct, 0).toFixed(1)}% of income)
- **Target Expense Ratio**: ${s.targetExpPct}% | **Target Savings Ratio**: ${s.targetSavPct}%

## Detailed Spending Breakdown by Category
${catBreakdown}

## Existing Investments Identified
${investBreakdown}

## CRITICAL AI GENERATION RULES:
1. **NO GENERIC TEMPLATES**: You MUST create custom recommendations dynamically tailored to the user's specific monthly surplus of ₹${Math.max(s.netSavings, 0).toLocaleString('en-IN')} and top spending categories above.
2. **RISK CATEGORY DISTRIBUTION**: Return AT LEAST 9 recommendation objects in your JSON array:
   - EXACTLY 3 (or more) with "riskLevel": "Low Risk" (capital preservation, fixed income, tax saving)
   - EXACTLY 3 (or more) with "riskLevel": "Medium Risk" (index funds, ELSS, multi-cap equity)
   - EXACTLY 3 (or more) with "riskLevel": "High Risk" (small cap growth, mid cap, sectoral equity)
3. **CALCULATE EXACT RUPEE AMOUNTS**: In titles, highlights, and content, specify concrete SIP rupee amounts computed directly from their ₹${Math.max(s.netSavings, 0).toLocaleString('en-IN')} monthly surplus.

Return ONLY a valid JSON array of recommendation objects following this exact schema:
[
  {
    "title": "Dynamic Title referencing specific spending or surplus (max 60 chars)",
    "badge": "Category (one of: PF/EPF, PPF, Mutual Fund, Tax Saving, Emergency Fund, Insurance, Retirement, Budget Tip, Equity Growth)",
    "riskLevel": "Low Risk" OR "Medium Risk" OR "High Risk",
    "summary": "1-2 sentence custom summary referencing user numbers.",
    "content": "Detailed dynamic recommendation (100-200 words) with specific SIP amounts calculated from their surplus, fund names, and rationale based on their top expense categories.",
    "highlight": "Specific metric (e.g. 'Recommended SIP: ₹5,000/mo' or 'Tax Savings: ₹15,000/yr')",
    "expectedReturn": "Estimated return (e.g. '8.25% Tax Free' or '12-14% CAGR')",
    "timeHorizon": "Timeframe (e.g. '5+ Years' or 'Liquid / Anytime')"
  }
]`;
}

async function callGeminiAPI(apiKey, prompt) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
          topP: 0.95,
          responseMimeType: 'application/json'
        }
      })
    }
  );

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    if (response.status === 400) {
      throw new Error('Invalid API key. Please check your Gemini API key and try again.');
    } else if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please wait a minute and try again.');
    } else {
      throw new Error(errData?.error?.message || `API error: ${response.status}`);
    }
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('No response received from AI. Please try again.');
  }
  return text;
}

function parseAIResponse(text) {
  let rawItems = [];
  let jsonStr = text.trim();

  // Strip markdown fences
  jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

  // Unescape outer quotes if whole payload is stringified JSON
  if (jsonStr.startsWith('"') && jsonStr.endsWith('"')) {
    try {
      jsonStr = JSON.parse(jsonStr);
    } catch (e) { }
  }

  // Extract bracket array bounds
  const startIdx = jsonStr.indexOf('[');
  const endIdx = jsonStr.lastIndexOf(']');
  if (startIdx !== -1 && endIdx !== -1) {
    jsonStr = jsonStr.substring(startIdx, endIdx + 1);
  }

  try {
    let parsed = JSON.parse(jsonStr);
    if (typeof parsed === 'string') {
      parsed = JSON.parse(parsed);
    }
    if (!Array.isArray(parsed) && typeof parsed === 'object' && parsed !== null) {
      const possibleArr = Object.values(parsed).find(v => Array.isArray(v));
      if (possibleArr) parsed = possibleArr;
      else parsed = [parsed];
    }
    if (Array.isArray(parsed) && parsed.length > 0) {
      rawItems = parsed.map(item => normalizeRecommendation(item)).filter(Boolean);
    }
  } catch (e) {
    console.warn('Primary JSON parse failed, attempting regex object extraction:', e);
  }

  if (rawItems.length === 0) {
    const extractedObjs = extractJsonObjectsFromText(text);
    if (extractedObjs.length > 0) {
      rawItems = extractedObjs.map(item => normalizeRecommendation(item)).filter(Boolean);
    }
  }

  if (rawItems.length === 0) {
    rawItems = fallbackParseTextToRecommendations(text);
  }

  // Enforce balanced 3+ items for Low Risk, Medium Risk, and High Risk dynamically
  return ensureBalancedRiskProfiles(rawItems);
}

function ensureBalancedRiskProfiles(items) {
  if (!Array.isArray(items)) items = [];

  const lowItems = items.filter(r => r && r.riskLevel === 'Low Risk');
  const medItems = items.filter(r => r && r.riskLevel === 'Medium Risk');
  const highItems = items.filter(r => r && r.riskLevel === 'High Risk');

  let lowIdx = 0;
  while (lowItems.length < 3) {
    const item = generateDynamicItemForRisk('Low Risk', lowIdx, analysisState);
    lowItems.push(item);
    lowIdx++;
  }

  let medIdx = 0;
  while (medItems.length < 3) {
    const item = generateDynamicItemForRisk('Medium Risk', medIdx, analysisState);
    medItems.push(item);
    medIdx++;
  }

  let highIdx = 0;
  while (highItems.length < 3) {
    const item = generateDynamicItemForRisk('High Risk', highIdx, analysisState);
    highItems.push(item);
    highIdx++;
  }

  return [...lowItems, ...medItems, ...highItems];
}

function generateDynamicItemForRisk(riskLevel, index, s) {
  const state = s || analysisState;
  const netSavings = Math.max(state.netSavings || 10000, 5000);
  const topCat = (state.categoryData && state.categoryData.length > 0) ? state.categoryData[0] : { category: 'Monthly Expenses', amount: 5000, percentage: '20' };
  const secCat = (state.categoryData && state.categoryData.length > 1) ? state.categoryData[1] : { category: 'Discretionary Outlay', amount: 3000, percentage: '15' };

  if (riskLevel === 'Low Risk') {
    const lowTemplates = [
      {
        title: `VPF Tax-Free Allocation from Net Surplus`,
        badge: 'Tax-Free Savings',
        summary: `Allocate ₹${Math.round(netSavings * 0.35).toLocaleString('en-IN')}/month (35% of your ₹${netSavings.toLocaleString('en-IN')} net savings) to VPF for guaranteed 8.25% tax-free compounding.`,
        content: `Based on your monthly net surplus of ₹${netSavings.toLocaleString('en-IN')}, increasing your Voluntary Provident Fund (VPF) allocation directly from payroll provides a guaranteed 8.25% sovereign-backed return under EEE tax status.`,
        highlight: `Recommended VPF: ₹${Math.round(netSavings * 0.35).toLocaleString('en-IN')}/month`,
        expectedReturn: '8.25% p.a. (Tax Free)',
        timeHorizon: 'Till Retirement / 5+ Yrs'
      },
      {
        title: `PPF Long-Term Tax Shield`,
        badge: 'Sovereign Asset',
        summary: `Deploy ₹${Math.round(netSavings * 0.25).toLocaleString('en-IN')}/month into PPF to lock in 7.1% tax-exempt annual growth under Section 80C.`,
        content: `Your total monthly spending is ₹${(state.totalExpense || 0).toLocaleString('en-IN')}. Setting aside a fixed monthly PPF contribution from your net savings builds long-term wealth completely exempt from capital gains tax upon maturity.`,
        highlight: `Recommended PPF: ₹${Math.round(netSavings * 0.25).toLocaleString('en-IN')}/month`,
        expectedReturn: '7.10% p.a. (Tax Free)',
        timeHorizon: '15 Years (Lock-in)'
      },
      {
        title: `Liquid Emergency Fund for ${topCat.category}`,
        badge: 'Capital Safety',
        summary: `Build a 6-month liquid emergency cushion of ₹${Math.round((state.totalExpense || 10000) * 6).toLocaleString('en-IN')} in Liquid Mutual Funds to safeguard against ${topCat.category} shocks.`,
        content: `With your highest expense category being ${topCat.category} at ₹${topCat.amount.toLocaleString('en-IN')}/month (${topCat.percentage}% of spending), maintaining liquid debt fund reserves ensures 6.8-7.3% yields with instant capital access.`,
        highlight: `Emergency Target: ₹${Math.round((state.totalExpense || 10000) * 6).toLocaleString('en-IN')}`,
        expectedReturn: '6.8 - 7.3% p.a.',
        timeHorizon: 'Liquid / Anytime'
      }
    ];
    return { riskLevel: 'Low Risk', ...lowTemplates[index % lowTemplates.length] };
  } else if (riskLevel === 'Medium Risk') {
    const medTemplates = [
      {
        title: `Nifty 50 Index Fund SIP`,
        badge: 'Core Index Equity',
        summary: `Start a ₹${Math.round(netSavings * 0.3).toLocaleString('en-IN')}/month SIP in a low-cost Nifty 50 Index Fund to compound growth at 12-14% CAGR.`,
        content: `Given your monthly surplus of ₹${netSavings.toLocaleString('en-IN')}, systematic index investing across India's top 50 blue-chip companies provides broad market equity exposure with minimal expense ratio (<0.1%).`,
        highlight: `Recommended SIP: ₹${Math.round(netSavings * 0.3).toLocaleString('en-IN')}/month`,
        expectedReturn: '12 - 14% CAGR',
        timeHorizon: '3 - 5+ Years'
      },
      {
        title: `ELSS Tax Saver Equity Fund`,
        badge: 'Tax Saver Equity',
        summary: `Save up to ₹46,800 in tax under Section 80C by investing ₹${Math.round(Math.min(netSavings * 0.25, 12500)).toLocaleString('en-IN')}/month in high-performing ELSS funds.`,
        content: `Re-allocating a portion of your monthly surplus into ELSS tax-saving funds provides dual benefits: Section 80C tax deduction and a 3-year lock-in (shortest among all tax instruments).`,
        highlight: `Tax Benefit: Up to ₹46,800/yr`,
        expectedReturn: '13 - 15% CAGR',
        timeHorizon: '3 Years (Lock-in)'
      },
      {
        title: `Flexi Cap Fund Re-allocation from ${secCat.category}`,
        badge: 'Diversified Equity',
        summary: `Optimize your ${secCat.category} outlay (₹${secCat.amount.toLocaleString('en-IN')}/mo) by redirecting ₹${Math.round(secCat.amount * 0.2).toLocaleString('en-IN')}/mo into Flexi Cap equity funds.`,
        content: `Trimming 20% from ${secCat.category} spending allows you to automatically invest ₹${Math.round(secCat.amount * 0.2).toLocaleString('en-IN')}/month into multi-cap funds dynamically managed across large, mid, and small-cap opportunities.`,
        highlight: `Monthly Redirect: ₹${Math.round(secCat.amount * 0.2).toLocaleString('en-IN')}/month`,
        expectedReturn: '13 - 16% CAGR',
        timeHorizon: '5+ Years'
      }
    ];
    return { riskLevel: 'Medium Risk', ...medTemplates[index % medTemplates.length] };
  } else {
    const highTemplates = [
      {
        title: `Small Cap Growth Alpha SIP`,
        badge: 'High Growth Equity',
        summary: `Allocate ₹${Math.round(netSavings * 0.2).toLocaleString('en-IN')}/month into top small-cap funds to generate high long-term alpha.`,
        content: `With your current savings rate of ${state.savingsPct ? state.savingsPct.toFixed(1) : 20}%, dedicating a 20% high-risk growth bucket into small-cap equities captures fast-growing Indian enterprises for 15-18%+ multi-year returns.`,
        highlight: `Recommended Growth SIP: ₹${Math.round(netSavings * 0.2).toLocaleString('en-IN')}/month`,
        expectedReturn: '15 - 18%+ CAGR',
        timeHorizon: '7+ Years'
      },
      {
        title: `Mid Cap Opportunities Fund`,
        badge: 'Emerging Leaders',
        summary: `Target market leaders of tomorrow with a ₹${Math.round(netSavings * 0.15).toLocaleString('en-IN')}/month SIP in mid-cap equity funds.`,
        content: `Mid-cap equities balance small-cap growth speed with established market stability. Your net surplus of ₹${netSavings.toLocaleString('en-IN')} supports a systematic mid-cap position for wealth acceleration.`,
        highlight: `Recommended Mid-Cap: ₹${Math.round(netSavings * 0.15).toLocaleString('en-IN')}/month`,
        expectedReturn: '14 - 17% CAGR',
        timeHorizon: '5 - 7+ Years'
      },
      {
        title: `Sectoral & Direct Equity Strategy`,
        badge: 'Focused Sector Growth',
        summary: `Deploy surplus capital into high-growth Indian sectors (Tech, Banking, Defense & Infra) for structural market tailwinds.`,
        content: `By managing high spending areas like ${topCat.category} (₹${topCat.amount.toLocaleString('en-IN')}), you can capture strategic upside in themed sector funds with 16-20%+ return potential.`,
        highlight: `Target Sector Alpha`,
        expectedReturn: '16 - 20%+ CAGR',
        timeHorizon: '5+ Years'
      }
    ];
    return { riskLevel: 'High Risk', ...highTemplates[index % highTemplates.length] };
  }
}

function extractJsonObjectsFromText(text) {
  const results = [];
  const matches = text.match(/\{[\s\S]*?\}(?=\s*,|\s*\]|\s*\}|\s*$)/g) || [];
  for (const m of matches) {
    try {
      const cleaned = m.replace(/,\s*([\}\]])/g, '$1');
      const obj = JSON.parse(cleaned);
      if (obj && (obj.title || obj.content || obj.badge)) {
        results.push(obj);
      }
    } catch (e) {
      const titleMatch = m.match(/"title"\s*:\s*"([^"]+)"/);
      const badgeMatch = m.match(/"badge"\s*:\s*"([^"]+)"/);
      const riskMatch = m.match(/"riskLevel"\s*:\s*"([^"]+)"/);
      const contentMatch = m.match(/"content"\s*:\s*"([^"]+)"/);
      const highlightMatch = m.match(/"highlight"\s*:\s*"([^"]+)"/);
      if (titleMatch || contentMatch) {
        results.push({
          title: titleMatch ? titleMatch[1] : 'Investment Recommendation',
          badge: badgeMatch ? badgeMatch[1] : 'Mutual Fund',
          riskLevel: riskMatch ? riskMatch[1] : 'Medium Risk',
          content: contentMatch ? contentMatch[1] : '',
          highlight: highlightMatch ? highlightMatch[1] : 'Recommended Action'
        });
      }
    }
  }
  return results;
}

function normalizeRecommendation(item) {
  if (!item) return null;

  // Handle case where item itself is a JSON string
  if (typeof item === 'string') {
    const trimmed = item.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        item = JSON.parse(trimmed);
      } catch (e) {
        const titleMatch = trimmed.match(/"title"\s*:\s*"([^"]+)"/);
        const contentMatch = trimmed.match(/"content"\s*:\s*"([^"]+)"/);
        const badgeMatch = trimmed.match(/"badge"\s*:\s*"([^"]+)"/);
        const riskMatch = trimmed.match(/"riskLevel"\s*:\s*"([^"]+)"/);
        const highlightMatch = trimmed.match(/"highlight"\s*:\s*"([^"]+)"/);
        item = {
          title: titleMatch ? titleMatch[1] : 'Investment Recommendation',
          content: contentMatch ? contentMatch[1] : trimmed,
          badge: badgeMatch ? badgeMatch[1] : 'Mutual Fund',
          riskLevel: riskMatch ? riskMatch[1] : 'Medium Risk',
          highlight: highlightMatch ? highlightMatch[1] : 'Recommended Action'
        };
      }
    } else {
      item = { title: 'Financial Advice Item', content: item };
    }
  }

  let content = item.content || item.description || item.details || item.summary || '';
  if (typeof content === 'object') content = JSON.stringify(content);
  content = String(content).replace(/^\s*[\{\}\[\]"']+\s*/g, '').trim();

  let title = item.title || item.heading || 'Investment Recommendation';
  if (title === '[' || title === '{' || title.length > 90 || title.startsWith('{') || title.startsWith('[')) {
    title = item.badge ? `${item.badge} Recommendation` : 'Personalized Financial Advice';
  }

  const badge = item.badge || item.category || 'Investment Strategy';
  let riskLevel = item.riskLevel || item.risk || item.riskCategory;

  if (typeof riskLevel === 'string') {
    const rLower = riskLevel.toLowerCase();
    if (rLower.includes('low')) riskLevel = 'Low Risk';
    else if (rLower.includes('high')) riskLevel = 'High Risk';
    else if (rLower.includes('med') || rLower.includes('moderate')) riskLevel = 'Medium Risk';
  }

  if (!riskLevel || !['Low Risk', 'Medium Risk', 'High Risk'].includes(riskLevel)) {
    riskLevel = classifyRiskLevel(badge, title, content);
  }

  let summary = item.summary || '';
  if (!summary || summary.startsWith('{') || summary.startsWith('[')) {
    const cleanText = content.replace(/<[^>]+>/g, '').replace(/[\{\}\[\]"']/g, '');
    summary = cleanText.slice(0, 140) + (cleanText.length > 140 ? '...' : '');
  }

  return {
    title: title,
    badge: badge,
    riskLevel: riskLevel,
    summary: summary,
    content: content,
    highlight: item.highlight || item.amount || item.metric || 'Recommended Action',
    expectedReturn: item.expectedReturn || item.returns || getReturnEstimate(riskLevel),
    timeHorizon: item.timeHorizon || item.horizon || getHorizonEstimate(riskLevel)
  };
}

function classifyRiskLevel(badge, title, content) {
  const combined = `${badge} ${title} ${content}`.toLowerCase();

  if (combined.includes('small cap') || combined.includes('mid cap') || combined.includes('sectoral') || combined.includes('direct equity') || combined.includes('crypto') || combined.includes('high risk') || combined.includes('stocks')) {
    return 'High Risk';
  }
  if (combined.includes('index') || combined.includes('large cap') || combined.includes('flexi cap') || combined.includes('elss') || combined.includes('hybrid') || combined.includes('mutual fund') || combined.includes('sip') || combined.includes('medium risk')) {
    return 'Medium Risk';
  }
  return 'Low Risk'; // VPF, EPF, PPF, FD, Emergency Fund, Gold, Insurance default
}

function getReturnEstimate(riskLevel) {
  if (riskLevel === 'High Risk') return '15 - 18% CAGR';
  if (riskLevel === 'Medium Risk') return '11 - 14% CAGR';
  return '7.1 - 8.25% p.a. (Tax Free)';
}

function getHorizonEstimate(riskLevel) {
  if (riskLevel === 'High Risk') return '5 - 7+ Years';
  if (riskLevel === 'Medium Risk') return '3 - 5 Years';
  return '1 - 3 Years / Liquid';
}

function fallbackParseTextToRecommendations(text) {
  // Split by double newlines or bullet numbers
  const sections = text.split(/(?=\n(?:\d+\.|\#\#|\*\*))/g).filter(s => s.trim().length > 30);
  if (sections.length === 0) {
    return [normalizeRecommendation({
      title: 'Personalized Financial Advice',
      badge: 'Investment Strategy',
      riskLevel: 'Medium Risk',
      summary: 'Comprehensive financial recommendations based on your spending profile.',
      content: text,
      highlight: 'See Details Below'
    })];
  }

  return sections.map((sec, idx) => {
    const lines = sec.trim().split('\n');
    const firstLine = lines[0].replace(/^[\#\*\d\.\-\s]+/, '').trim();
    const title = firstLine.length < 70 ? firstLine : `Recommendation #${idx + 1}`;
    const body = lines.slice(1).join('\n').trim() || sec.trim();

    return normalizeRecommendation({
      title: title,
      badge: idx % 2 === 0 ? 'Mutual Fund' : 'Tax Saving',
      content: body,
      summary: body.slice(0, 130) + '...'
    });
  });
}

function renderAIRecommendations(recommendations) {
  currentAiRecommendations = recommendations;

  // Calculate risk counts
  const counts = {
    all: recommendations.length,
    low: recommendations.filter(r => r.riskLevel === 'Low Risk').length,
    med: recommendations.filter(r => r.riskLevel === 'Medium Risk').length,
    high: recommendations.filter(r => r.riskLevel === 'High Risk').length
  };

  // Update tab counters
  const cAll = $('#count-all');
  const cLow = $('#count-low');
  const cMed = $('#count-med');
  const cHigh = $('#count-high');

  if (cAll) cAll.textContent = counts.all;
  if (cLow) cLow.textContent = counts.low;
  if (cMed) cMed.textContent = counts.med;
  if (cHigh) cHigh.textContent = counts.high;

  renderFilteredAiCards();
  enableReportExportButtons();
}

function renderFilteredAiCards() {
  aiRecoGrid.innerHTML = '';

  const filtered = currentAiRecommendations.filter(r => {
    if (activeRiskFilter === 'all') return true;
    return r.riskLevel === activeRiskFilter;
  });

  if (filtered.length === 0) {
    aiRecoGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align:center; padding: 40px 20px; color: var(--text-muted);">
        <p style="font-size: 1rem; font-weight: 600;">No ${activeRiskFilter} recommendations available.</p>
        <p style="font-size: .85rem;">Select another risk tab above to view other options.</p>
      </div>
    `;
    return;
  }

  filtered.forEach((rec, i) => {
    const card = document.createElement('div');
    const riskClass = rec.riskLevel === 'Low Risk' ? 'risk-low' : rec.riskLevel === 'Medium Risk' ? 'risk-medium' : 'risk-high';
    const riskTagClass = rec.riskLevel === 'Low Risk' ? 'risk-tag--low' : rec.riskLevel === 'Medium Risk' ? 'risk-tag--medium' : 'risk-tag--high';
    const riskIcon = rec.riskLevel === 'Low Risk' ? '🛡️' : rec.riskLevel === 'Medium Risk' ? '⚖️' : '🚀';

    card.className = `ai-reco-card ${riskClass} fade-in`;
    card.style.animationDelay = (i * 0.08) + 's';

    // Format content details
    let formattedContent = rec.content || '';
    formattedContent = formattedContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formattedContent = formattedContent.replace(/\n- /g, '<br>• ');
    formattedContent = formattedContent.replace(/\n\* /g, '<br>• ');
    formattedContent = formattedContent.replace(/\n\n/g, '<br><br>');
    formattedContent = formattedContent.replace(/\n/g, '<br>');

    const badgeEmoji = getBadgeEmoji(rec.badge);

    card.innerHTML = `
      <div class="ai-card-badges">
        <span class="ai-card-badge">${badgeEmoji} ${rec.badge || 'Advice'}</span>
        <span class="risk-tag ${riskTagClass}">${riskIcon} ${rec.riskLevel}</span>
      </div>
      <h4>${rec.title || 'Recommendation'}</h4>
      <p class="ai-summary-text">${rec.summary || ''}</p>
      
      ${rec.highlight ? `<span class="ai-highlight">📌 ${rec.highlight}</span>` : ''}

      <div class="ai-meta-grid">
        <div class="ai-meta-item">
          <span class="ai-meta-label">Est. Returns</span>
          <span class="ai-meta-val">${rec.expectedReturn}</span>
        </div>
        <div class="ai-meta-item">
          <span class="ai-meta-label">Time Horizon</span>
          <span class="ai-meta-val">${rec.timeHorizon}</span>
        </div>
      </div>

      <button class="btn-see-details" id="btn-details-${i}" aria-expanded="false">
        <span>See Details Below</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      <div class="ai-card-details hidden" id="ai-details-${i}">
        ${formattedContent}
      </div>
    `;

    // Attach click handler for "See Details Below" button
    const btnDetails = card.querySelector(`#btn-details-${i}`);
    const detailsDiv = card.querySelector(`#ai-details-${i}`);

    btnDetails.addEventListener('click', () => {
      const isHidden = detailsDiv.classList.contains('hidden');
      if (isHidden) {
        detailsDiv.classList.remove('hidden');
        btnDetails.classList.add('open');
        btnDetails.setAttribute('aria-expanded', 'true');
        btnDetails.querySelector('span').textContent = 'Hide Details';
      } else {
        detailsDiv.classList.add('hidden');
        btnDetails.classList.remove('open');
        btnDetails.setAttribute('aria-expanded', 'false');
        btnDetails.querySelector('span').textContent = 'See Details Below';
      }
    });

    aiRecoGrid.appendChild(card);
  });
}

// Risk Filter Tab Handlers & Report Export Init
document.addEventListener('DOMContentLoaded', () => {
  const riskTabs = $('#ai-risk-tabs');
  if (riskTabs) {
    riskTabs.addEventListener('click', (e) => {
      const tab = e.target.closest('.risk-tab');
      if (!tab) return;

      $$('.risk-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeRiskFilter = tab.dataset.risk;
      renderFilteredAiCards();
    });
  }
  initReportExport();
});

function enableReportExportButtons() {
  const pdfBtn = $('#download-pdf-btn');
  const wordBtn = $('#download-word-btn');
  const unlockHint = $('#export-unlock-hint');

  if (pdfBtn) {
    pdfBtn.disabled = false;
    pdfBtn.removeAttribute('title');
  }
  if (wordBtn) {
    wordBtn.disabled = false;
    wordBtn.removeAttribute('title');
  }
  if (unlockHint) {
    unlockHint.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      <span style="color:#34d399;">AI Recommendations ready! Click Download button to download your complete report.</span>
    `;
    unlockHint.style.borderColor = 'rgba(52, 211, 153, 0.3)';
    unlockHint.style.background = 'rgba(52, 211, 153, 0.08)';
  }
}

function initReportExport() {
  const pdfBtn = $('#download-pdf-btn');
  const wordBtn = $('#download-word-btn');
  const statusBanner = $('#export-status-banner');

  if (pdfBtn) {
    pdfBtn.addEventListener('click', async () => {
      if (pdfBtn.disabled) return;
      if (!analysisState.totalIncome || !currentAiRecommendations.length) {
        alert('Please generate AI recommendations first.');
        return;
      }

      pdfBtn.disabled = true;
      const origHtml = pdfBtn.innerHTML;
      pdfBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
        Generating PDF...
      `;

      try {
        await downloadReportPdf();
        statusBanner.className = 'export-status-banner';
        statusBanner.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <span>📄 PDF Financial Report successfully downloaded as <strong>SpendWise_Financial_Report.pdf</strong>!</span>
        `;
        statusBanner.classList.remove('hidden');
      } catch (err) {
        console.error('PDF Download Error:', err);
        statusBanner.className = 'export-status-banner error';
        statusBanner.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          <span>PDF generation failed. ${err.message || 'Please try downloading the Word report instead.'}</span>
        `;
        statusBanner.classList.remove('hidden');
      } finally {
        pdfBtn.disabled = false;
        pdfBtn.innerHTML = origHtml;
      }
    });
  }

  if (wordBtn) {
    wordBtn.addEventListener('click', () => {
      if (wordBtn.disabled) return;
      if (!analysisState.totalIncome || !currentAiRecommendations.length) {
        alert('Please generate AI recommendations first.');
        return;
      }

      try {
        downloadReportWord();
        statusBanner.className = 'export-status-banner';
        statusBanner.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <span>📝 Word Financial Report successfully downloaded as <strong>SpendWise_Financial_Report.doc</strong>!</span>
        `;
        statusBanner.classList.remove('hidden');
      } catch (err) {
        console.error('Word Download Error:', err);
        statusBanner.className = 'export-status-banner error';
        statusBanner.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          <span>Failed to generate Word report. ${err.message}</span>
        `;
        statusBanner.classList.remove('hidden');
      }
    });
  }
}

function downloadReportWord() {
  const s = analysisState;
  const categoryRows = (s.categoryData || []).map(c => `
    <tr>
      <td style="padding:6pt; border:1pt solid #cbd5e1;">${c.category}</td>
      <td style="padding:6pt; border:1pt solid #cbd5e1; text-align:right; font-weight:bold;">₹${c.amount.toLocaleString('en-IN')}</td>
      <td style="padding:6pt; border:1pt solid #cbd5e1; text-align:right;">${c.percentage}%</td>
    </tr>
  `).join('');

  const wordContent = `
    <html xmlns:o='urn:schemas-microsoft-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>SpendWise Financial Report</title>
      <style>
        body { font-family: 'Calibri', 'Arial', sans-serif; color: #0f172a; padding: 20pt; line-height: 1.5; }
        h1 { color: #4338ca; font-size: 22pt; margin-bottom: 2pt; text-align: center; }
        h2 { color: #0f172a; font-size: 13pt; border-bottom: 2pt solid #0284c7; padding-bottom: 4pt; margin-top: 16pt; }
        h3 { color: #4338ca; font-size: 12pt; margin-top: 12pt; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16pt; font-size: 10pt; }
        th { background: #f1f5f9; color: #1e293b; padding: 7pt; border: 1pt solid #cbd5e1; text-align: left; }
        td { padding: 7pt; border: 1pt solid #e2e8f0; }
        .reco-card { background: #f8fafc; border: 1pt solid #cbd5e1; border-radius: 6pt; padding: 10pt; margin-bottom: 10pt; }
        .badge { font-weight: bold; color: #4338ca; text-transform: uppercase; font-size: 8.5pt; }
        .risk { font-weight: bold; font-size: 8.5pt; float: right; padding: 2pt 6pt; background: #e0e7ff; color: #3730a3; }
        .highlight { background: #e0e7ff; color: #3730a3; padding: 3pt 6pt; font-weight: bold; font-size: 9pt; display: inline-block; margin: 4pt 0; }
      </style>
    </head>
    <body>
      <h1>SpendWise Financial Analysis Report</h1>
      <p style="text-align: center; color: #64748b; font-size: 11pt;">Personalized Monthly Spending Breakdown & AI Investment Strategy</p>
      <p style="text-align: center; color: #94a3b8; font-size: 9pt;">Generated on: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}</p>
      <hr style="border: none; border-top: 2pt solid #4338ca; margin: 14pt 0;">

      <h2>📊 Monthly Executive Summary</h2>
      <table>
        <thead>
          <tr><th>Financial Metric</th><th style="text-align:right;">Amount (₹)</th><th style="text-align:right;">% of Income</th></tr>
        </thead>
        <tbody>
          <tr><td><strong>Total Monthly Income</strong></td><td style="text-align:right; color:#16a34a; font-weight:bold;">₹${s.totalIncome.toLocaleString('en-IN')}</td><td style="text-align:right;">100.0%</td></tr>
          <tr><td><strong>Total Expenses</strong></td><td style="text-align:right; color:#dc2626; font-weight:bold;">₹${s.totalExpense.toLocaleString('en-IN')}</td><td style="text-align:right;">${s.actualExpPct.toFixed(1)}%</td></tr>
          <tr><td><strong>Total Investments</strong></td><td style="text-align:right; color:#4338ca; font-weight:bold;">₹${s.totalInvestment.toLocaleString('en-IN')}</td><td style="text-align:right;">${s.investPct.toFixed(1)}%</td></tr>
          <tr><td><strong>Net Savings</strong></td><td style="text-align:right; color:#0284c7; font-weight:bold;">₹${Math.max(s.netSavings, 0).toLocaleString('en-IN')}</td><td style="text-align:right;">${Math.max(s.savingsPct, 0).toFixed(1)}%</td></tr>
        </tbody>
      </table>

      ${categoryRows ? `
        <h2>📁 Expense Category Breakdown</h2>
        <table>
          <thead><tr><th>Category</th><th style="text-align:right;">Amount (₹)</th><th style="text-align:right;">% of Spending</th></tr></thead>
          <tbody>${categoryRows}</tbody>
        </table>
      ` : ''}

      <h2>✦ AI Investment Recommendations Blueprint</h2>
      ${(currentAiRecommendations || []).map((r, i) => `
        <div class="reco-card">
          <div><span class="badge">#${i + 1} — ${r.badge}</span> <span class="risk">${r.riskLevel}</span></div>
          <h3 style="margin: 4pt 0;">${r.title}</h3>
          <p style="margin: 4pt 0; font-size: 10pt;">${r.summary || ''}</p>
          ${r.highlight ? `<div class="highlight">📌 ${r.highlight}</div>` : ''}
          <p style="font-size: 9pt; color: #475569; margin: 4pt 0;"><strong>Est. Return:</strong> ${r.expectedReturn} &nbsp;|&nbsp; <strong>Time Horizon:</strong> ${r.timeHorizon}</p>
          <p style="font-size: 9pt; color: #334155; margin-top: 4pt;"><strong>Details & Rationale:</strong> ${r.content ? r.content.replace(/<[^>]+>/g, '') : ''}</p>
        </div>
      `).join('')}

      <div style="text-align:center; margin-top: 20pt; font-size: 9pt; color: #94a3b8; border-top: 1pt solid #cbd5e1; padding-top: 8pt;">
        SpendWise Monthly Spend Analyzer &copy; 2026 — Confidential Financial Report
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', wordContent], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'SpendWise_Financial_Report.doc';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

async function downloadReportPdf() {
  const s = analysisState;
  const tempDiv = document.createElement('div');
  tempDiv.id = 'pdf-render-container';
  tempDiv.style.position = 'fixed';
  tempDiv.style.top = '0';
  tempDiv.style.left = '0';
  tempDiv.style.width = '790px';
  tempDiv.style.padding = '32px';
  tempDiv.style.fontFamily = "'Inter', system-ui, -apple-system, sans-serif";
  tempDiv.style.color = '#0f172a';
  tempDiv.style.background = '#ffffff';
  tempDiv.style.zIndex = '99999';
  tempDiv.style.opacity = '1';
  tempDiv.style.boxSizing = 'border-box';

  let recoHtml = '';
  if (currentAiRecommendations && currentAiRecommendations.length > 0) {
    recoHtml = `
      <h3 style="color:#4338ca; margin-top:24px; margin-bottom:12px; border-bottom:2px solid #6366f1; padding-bottom:4px; font-size:15px;">✦ AI Investment Recommendations Blueprint (${currentAiRecommendations.length} Strategies)</h3>
      ${currentAiRecommendations.map((r, idx) => `
        <div style="margin-bottom:12px; padding:12px 16px; border:1px solid #cbd5e1; border-radius:6px; background:#f8fafc; page-break-inside:avoid;">
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:10px; font-weight:bold; margin-bottom:4px;">
            <span style="color:#4338ca; text-transform:uppercase;">#${idx + 1} — ${r.badge || 'Recommendation'}</span>
            <span style="padding:2px 8px; border-radius:10px; font-weight:700; background:${r.riskLevel === 'Low Risk' ? '#dcfce7' : r.riskLevel === 'Medium Risk' ? '#fef3c7' : '#ffe4e6'}; color:${r.riskLevel === 'Low Risk' ? '#15803d' : r.riskLevel === 'Medium Risk' ? '#b45309' : '#be123c'};">${r.riskLevel}</span>
          </div>
          <h4 style="margin:0 0 4px 0; color:#0f172a; font-size:14px; font-weight:700;">${r.title}</h4>
          <p style="margin:0 0 6px 0; font-size:11px; color:#334155; line-height:1.4;">${r.summary || ''}</p>
          ${r.highlight ? `<div style="margin-bottom:6px; font-size:10px; font-weight:600; color:#3730a3; background:#e0e7ff; padding:3px 8px; border-radius:4px; display:inline-block;">📌 ${r.highlight}</div>` : ''}
          <div style="display:flex; gap:16px; font-size:10px; color:#475569; background:#ffffff; padding:6px 10px; border-radius:4px; border:1px solid #e2e8f0; margin-bottom:6px;">
            <div><strong>Est. Return:</strong> ${r.expectedReturn || 'N/A'}</div>
            <div><strong>Time Horizon:</strong> ${r.timeHorizon || 'N/A'}</div>
          </div>
          <div style="font-size:10px; color:#475569; border-top:1px dashed #cbd5e1; padding-top:4px; margin-top:4px; line-height:1.3;">
            <strong>Details:</strong> ${r.content ? r.content.replace(/<[^>]+>/g, '') : ''}
          </div>
        </div>
      `).join('')}
    `;
  }

  const categoryRows = (analysisState.categoryData || []).map(c => `
    <tr>
      <td style="padding:6px; border:1px solid #e2e8f0;">${c.category}</td>
      <td style="padding:6px; border:1px solid #e2e8f0; text-align:right; font-weight:600;">₹${c.amount.toLocaleString('en-IN')}</td>
      <td style="padding:6px; border:1px solid #e2e8f0; text-align:right;">${c.percentage}%</td>
    </tr>
  `).join('');

  tempDiv.innerHTML = `
    <div style="text-align:center; margin-bottom:20px; border-bottom:3px solid #4338ca; padding-bottom:14px;">
      <h1 style="color:#4338ca; margin:0; font-size:24px; font-weight:800;">SpendWise Financial Analysis Report</h1>
      <p style="color:#64748b; margin:4px 0 0 0; font-size:12px;">Personalized Monthly Spending Breakdown & AI Investment Strategy</p>
      <p style="color:#94a3b8; font-size:10px; margin-top:4px;">Generated on: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}</p>
    </div>

    <h3 style="color:#0f172a; border-bottom:2px solid #0284c7; padding-bottom:4px; font-size:14px; margin-bottom:10px;">📊 Monthly Executive Summary</h3>
    <table style="width:100%; border-collapse:collapse; margin-bottom:20px; font-size:12px;">
      <thead>
        <tr style="background:#f1f5f9; color:#1e293b;">
          <th style="padding:8px; text-align:left; border:1px solid #cbd5e1;">Financial Metric</th>
          <th style="padding:8px; text-align:right; border:1px solid #cbd5e1;">Amount (₹)</th>
          <th style="padding:8px; text-align:right; border:1px solid #cbd5e1;">% of Income</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding:8px; border:1px solid #e2e8f0; font-weight:bold; color:#16a34a;">Total Monthly Income</td>
          <td style="padding:8px; border:1px solid #e2e8f0; text-align:right; font-weight:bold; color:#16a34a;">₹${s.totalIncome.toLocaleString('en-IN')}</td>
          <td style="padding:8px; border:1px solid #e2e8f0; text-align:right; font-weight:bold;">100.0%</td>
        </tr>
        <tr>
          <td style="padding:8px; border:1px solid #e2e8f0; font-weight:bold; color:#dc2626;">Total Expenses</td>
          <td style="padding:8px; border:1px solid #e2e8f0; text-align:right; font-weight:bold; color:#dc2626;">₹${s.totalExpense.toLocaleString('en-IN')}</td>
          <td style="padding:8px; border:1px solid #e2e8f0; text-align:right;">${s.actualExpPct.toFixed(1)}%</td>
        </tr>
        <tr>
          <td style="padding:8px; border:1px solid #e2e8f0; font-weight:bold; color:#4338ca;">Total Investments</td>
          <td style="padding:8px; border:1px solid #e2e8f0; text-align:right; font-weight:bold; color:#4338ca;">₹${s.totalInvestment.toLocaleString('en-IN')}</td>
          <td style="padding:8px; border:1px solid #e2e8f0; text-align:right;">${s.investPct.toFixed(1)}%</td>
        </tr>
        <tr>
          <td style="padding:8px; border:1px solid #e2e8f0; font-weight:bold; color:#0284c7;">Net Savings</td>
          <td style="padding:8px; border:1px solid #e2e8f0; text-align:right; font-weight:bold; color:#0284c7;">₹${Math.max(s.netSavings, 0).toLocaleString('en-IN')}</td>
          <td style="padding:8px; border:1px solid #e2e8f0; text-align:right;">${Math.max(s.savingsPct, 0).toFixed(1)}%</td>
        </tr>
      </tbody>
    </table>

    ${categoryRows ? `
      <h3 style="color:#0f172a; border-bottom:2px solid #0284c7; padding-bottom:4px; font-size:14px; margin-bottom:10px;">📁 Expense Category Breakdown</h3>
      <table style="width:100%; border-collapse:collapse; margin-bottom:20px; font-size:11px;">
        <thead>
          <tr style="background:#f1f5f9; color:#1e293b;">
            <th style="padding:6px; text-align:left; border:1px solid #cbd5e1;">Category</th>
            <th style="padding:6px; text-align:right; border:1px solid #cbd5e1;">Amount (₹)</th>
            <th style="padding:6px; text-align:right; border:1px solid #cbd5e1;">% of Total</th>
          </tr>
        </thead>
        <tbody>
          ${categoryRows}
        </tbody>
      </table>
    ` : ''}

    ${recoHtml}

    <div style="margin-top:24px; text-align:center; font-size:10px; color:#94a3b8; border-top:1px solid #e2e8f0; padding-top:8px;">
      SpendWise Monthly Spend Analyzer &copy; 2026 — Confidential Financial Report
    </div>
  `;

  document.body.appendChild(tempDiv);

  const opt = {
    margin: [8, 8, 8, 8],
    filename: `SpendWise_Financial_Report.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  try {
    if (typeof html2pdf !== 'undefined') {
      await html2pdf().set(opt).from(tempDiv).save();
    } else if (window.jspdf) {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF('p', 'pt', 'a4');
      await doc.html(tempDiv, {
        callback: function (pdf) {
          pdf.save('SpendWise_Financial_Report.pdf');
        },
        x: 10,
        y: 10,
        width: 575,
        windowWidth: 800
      });
    } else {
      downloadReportWord();
    }
  } catch (err) {
    console.error('PDF export engine error, attempting Word export fallback:', err);
    downloadReportWord();
  } finally {
    if (tempDiv && tempDiv.parentNode) {
      document.body.removeChild(tempDiv);
    }
  }
}

function getBadgeEmoji(badge) {
  if (!badge) return '✦';
  const b = badge.toLowerCase();
  if (b.includes('pf') || b.includes('epf')) return '🏦';
  if (b.includes('mutual') || b.includes('sip')) return '📊';
  if (b.includes('tax')) return '🧾';
  if (b.includes('emergency')) return '🛡️';
  if (b.includes('insurance')) return '🔒';
  if (b.includes('retirement')) return '🏖️';
  if (b.includes('budget')) return '💡';
  if (b.includes('invest')) return '📈';
  return '✦';
}

// ───────── Nav Helper ─────────
function updateNavActive(section) {
  $$('.nav-link').forEach(l => l.classList.toggle('active', l.dataset.section === section));
}

// ───────── Scroll spy for nav ─────────
window.addEventListener('scroll', () => {
  const sections = ['upload', 'dashboard', 'recommendations', 'ai'];
  for (const s of sections.reverse()) {
    const el = document.getElementById(s + '-section');
    if (el && !el.classList.contains('hidden') && el.getBoundingClientRect().top < 200) {
      updateNavActive(s);
      break;
    }
  }
});
