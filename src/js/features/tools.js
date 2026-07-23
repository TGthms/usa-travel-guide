'use strict';
/* USA Travel Guide — features/tools.js
   Classic non-module script. Shared global scope with other src/js scripts.
   Canonical load order: see header of src/js/app.js
*/

/* ── TRAVEL TOOLS ──
   Dedicated page (tools.html). Live widgets refresh on language/unit change. */
function refreshToolsLive() {
  if (typeof updateWorldClock === 'function') updateWorldClock();
  if (typeof populateCurrencySelects === 'function') populateCurrencySelects();
  if (typeof updateCurrency === 'function') updateCurrency();
  if (typeof updateTipEstimator === 'function') updateTipEstimator();
  if (typeof updateDriveUnitLabels === 'function') updateDriveUnitLabels();
  if (typeof updateDriveCost === 'function') updateDriveCost();
}

// Dynamic UI strings for the Tools panel (currency converter, tip estimator,
// world clock). These are generated at runtime rather than sitting in static
// HTML, so they need their own small translation table alongside the main
// I18N dictionary — this keeps the Tools panel fully localized instead of
// silently staying in English when another language is selected.
const TOOLS_TEXT = {
  en: { sameCurrency: 'Same currency selected.', updating: 'Updating...', fetching: 'Fetching latest available daily rate.', rateUnavailable: 'Rate unavailable', checkConnection: 'Check your connection and try again.', tax: 'Tax', tip: 'Tip',
    driveGal: 'gal', driveL: 'L', salesTaxZero: 'No statewide sales tax (local may apply).',
    driveMpgMi: 'MPG', driveMpgKm: 'L/100 km', driveFuelGal: 'Fuel $/gal', driveFuelL: 'Fuel $/L',
    driveEvMi: 'mi/kWh', driveEvKm: 'kWh/100 km',
    cities: { 'Los Angeles': 'Los Angeles', 'New York': 'New York', 'London': 'London', 'Paris': 'Paris', 'Tokyo': 'Tokyo', 'Shanghai': 'Shanghai' } },
  es: { sameCurrency: 'Misma divisa seleccionada.', updating: 'Actualizando…', fetching: 'Obteniendo el último tipo de cambio diario disponible.', rateUnavailable: 'Tipo de cambio no disponible', checkConnection: 'Comprueba tu conexión e inténtalo de nuevo.', tax: 'Impuesto', tip: 'Propina',
    driveGal: 'gal', driveL: 'L', salesTaxZero: 'Sin impuesto estatal de ventas (puede haber impuestos locales).',
    driveMpgMi: 'MPG', driveMpgKm: 'L/100 km', driveFuelGal: 'Combustible $/gal', driveFuelL: 'Combustible $/L',
    driveEvMi: 'mi/kWh', driveEvKm: 'kWh/100 km',
    cities: { 'Los Angeles': 'Los Ángeles', 'New York': 'Nueva York', 'London': 'Londres', 'Paris': 'París', 'Tokyo': 'Tokio', 'Shanghai': 'Shanghái' } },
  zh: { sameCurrency: '已选择相同货币。', updating: '更新中…', fetching: '正在获取最新每日汇率。', rateUnavailable: '汇率不可用', checkConnection: '请检查网络连接后重试。', tax: '税费', tip: '小费',
    driveGal: '加仑', driveL: '升', salesTaxZero: '该州无州销售税（可能仍有地方税）。',
    driveMpgMi: 'MPG', driveMpgKm: '升/百公里', driveFuelGal: '油价 $/加仑', driveFuelL: '油价 $/升',
    driveEvMi: '英里/度', driveEvKm: '度/百公里',
    cities: { 'Los Angeles': '洛杉矶', 'New York': '纽约', 'London': '伦敦', 'Paris': '巴黎', 'Tokyo': '东京', 'Shanghai': '上海' } },
  ja: { sameCurrency: '同じ通貨が選択されています。', updating: '更新中…', fetching: '最新の為替レートを取得しています。', rateUnavailable: 'レートを取得できません', checkConnection: '接続を確認して再度お試しください。', tax: '税金', tip: 'チップ',
    driveGal: 'ガロン', driveL: 'L', salesTaxZero: '州の売上税はありません（地方税がかかる場合あり）。',
    driveMpgMi: 'MPG', driveMpgKm: 'L/100km', driveFuelGal: '燃料 $/gal', driveFuelL: '燃料 $/L',
    driveEvMi: 'mi/kWh', driveEvKm: 'kWh/100km',
    cities: { 'Los Angeles': 'ロサンゼルス', 'New York': 'ニューヨーク', 'London': 'ロンドン', 'Paris': 'パリ', 'Tokyo': '東京', 'Shanghai': '上海' } },
};
function toolsText() { return TOOLS_TEXT[currentLang] || TOOLS_TEXT.en; }

/* Localized currency display names for the converter selects (codes stay ISO). */
const CURRENCY_CODES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'HKD', 'CHF', 'MXN'];
const CURRENCY_NAMES = {
  en: {
    USD: 'US Dollar', EUR: 'Euro', GBP: 'British Pound', CAD: 'Canadian Dollar',
    AUD: 'Australian Dollar', JPY: 'Japanese Yen', CNY: 'Chinese Yuan',
    HKD: 'Hong Kong Dollar', CHF: 'Swiss Franc', MXN: 'Mexican Peso'
  },
  es: {
    USD: 'Dólar estadounidense', EUR: 'Euro', GBP: 'Libra esterlina', CAD: 'Dólar canadiense',
    AUD: 'Dólar australiano', JPY: 'Yen japonés', CNY: 'Yuan chino',
    HKD: 'Dólar de Hong Kong', CHF: 'Franco suizo', MXN: 'Peso mexicano'
  },
  zh: {
    USD: '美元', EUR: '欧元', GBP: '英镑', CAD: '加拿大元',
    AUD: '澳大利亚元', JPY: '日元', CNY: '人民币',
    HKD: '港元', CHF: '瑞士法郎', MXN: '墨西哥比索'
  },
  ja: {
    USD: '米ドル', EUR: 'ユーロ', GBP: '英ポンド', CAD: 'カナダドル',
    AUD: 'オーストラリアドル', JPY: '日本円', CNY: '中国元',
    HKD: '香港ドル', CHF: 'スイスフラン', MXN: 'メキシコペソ'
  }
};

function getCurrencyNames() {
  return CURRENCY_NAMES[currentLang] || CURRENCY_NAMES.en;
}

function currencyOptionLabel(code) {
  const names = getCurrencyNames();
  const name = names[code] || code;
  // CJK: name first is more natural; Latin: code then name
  if (currentLang === 'zh' || currentLang === 'ja') return `${name} (${code})`;
  return `${code} — ${name}`;
}

function populateCurrencySelects() {
  if (!currencyFrom || !currencyTo) return;
  const prevFrom = currencyFrom.value || 'USD';
  const prevTo = currencyTo.value || 'EUR';
  const mkOptions = (selected) => CURRENCY_CODES.map(code =>
    `<option value="${code}"${code === selected ? ' selected' : ''}>${currencyOptionLabel(code)}</option>`
  ).join('');
  currencyFrom.innerHTML = mkOptions(CURRENCY_CODES.includes(prevFrom) ? prevFrom : 'USD');
  currencyTo.innerHTML = mkOptions(CURRENCY_CODES.includes(prevTo) ? prevTo : 'EUR');
  // Ensure selection stuck if browser ignored selected attributes
  currencyFrom.value = CURRENCY_CODES.includes(prevFrom) ? prevFrom : 'USD';
  currencyTo.value = CURRENCY_CODES.includes(prevTo) ? prevTo : 'EUR';
}

const currencyAmount = document.getElementById('currencyAmount');
const currencyFrom = document.getElementById('currencyFrom');
const currencyTo = document.getElementById('currencyTo');
const currencyResult = document.getElementById('currencyResult');
const currencyMeta = document.getElementById('currencyMeta');
const currencySwap = document.getElementById('currencySwap');
let currencyAbort = null;

function moneyFmt(value, currency) {
  try { return new Intl.NumberFormat(currentLang === 'zh' ? 'zh-CN' : currentLang === 'ja' ? 'ja-JP' : currentLang === 'es' ? 'es-ES' : 'en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value); }
  catch (e) { return `${value.toFixed(2)} ${currency}`; }
}

// Build localized currency options as soon as the selects exist.
populateCurrencySelects();

let currencyReqId = 0;

async function updateCurrency() {
  if (!currencyAmount || !currencyFrom || !currencyTo || !currencyResult) return;
  // Always cancel any in-flight request first (including same-currency / offline paths)
  // so a late fetch cannot overwrite a newer UI state.
  if (currencyAbort && typeof currencyAbort.abort === 'function') {
    try { currencyAbort.abort(); } catch (_) { /* ignore */ }
  }
  currencyAbort = null;

  const amount = Math.max(0, Number(currencyAmount.value) || 0);
  const base = currencyFrom.value;
  const quote = currencyTo.value;
  const t = toolsText();
  const reqId = ++currencyReqId;

  if (base === quote) {
    currencyResult.textContent = `${moneyFmt(amount, base)} = ${moneyFmt(amount, quote)}`;
    currencyMeta.textContent = t.sameCurrency;
    return;
  }
  if (typeof fetch !== 'function') {
    currencyResult.textContent = t.rateUnavailable;
    currencyMeta.textContent = t.checkConnection;
    return;
  }
  const canAbort = typeof AbortController === 'function';
  currencyAbort = canAbort ? new AbortController() : null;
  currencyResult.textContent = t.updating;
  currencyMeta.textContent = t.fetching;
  try {
    const fetchOpts = currencyAbort ? { signal: currencyAbort.signal } : {};
    const res = await fetch(`https://api.frankfurter.dev/v2/rate/${base}/${quote}`, fetchOpts);
    if (reqId !== currencyReqId) return; // superseded
    if (!res.ok) throw new Error('Rate unavailable');
    const data = await res.json();
    if (reqId !== currencyReqId) return;
    // Inputs may have changed while we waited (even if abort is unsupported).
    if (currencyFrom.value !== base || currencyTo.value !== quote) return;
    const stillAmount = Math.max(0, Number(currencyAmount.value) || 0);
    const converted = stillAmount * Number(data.rate);
    currencyResult.textContent = `${moneyFmt(stillAmount, base)} = ${moneyFmt(converted, quote)}`;
    currencyMeta.textContent = `1 ${base} = ${Number(data.rate).toFixed(4)} ${quote}${data.date ? ` · ${data.date}` : ''}`;
  } catch (err) {
    if (err && err.name === 'AbortError') return;
    if (reqId !== currencyReqId) return;
    currencyResult.textContent = t.rateUnavailable;
    currencyMeta.textContent = t.checkConnection;
  }
}

[currencyAmount, currencyFrom, currencyTo].forEach(el => {
  if (el) el.addEventListener('input', updateCurrency);
});
[currencyFrom, currencyTo].forEach(el => {
  if (el) el.addEventListener('change', updateCurrency);
});
if (currencySwap) {
  currencySwap.addEventListener('click', () => {
    const from = currencyFrom.value;
    currencyFrom.value = currencyTo.value;
    currencyTo.value = from;
    updateCurrency();
  });
}

const worldClockList = document.getElementById('worldClockList');
const CLOCK_ZONES = [
  ['Los Angeles', 'America/Los_Angeles'], ['New York', 'America/New_York'], ['London', 'Europe/London'], ['Paris', 'Europe/Paris'], ['Tokyo', 'Asia/Tokyo'], ['Shanghai', 'Asia/Shanghai']
];
function updateWorldClock() {
  if (!worldClockList) return;
  const locale = currentLang === 'zh' ? 'zh-CN' : currentLang === 'ja' ? 'ja-JP' : currentLang === 'es' ? 'es-ES' : 'en-US';
  const cities = toolsText().cities;
  worldClockList.innerHTML = CLOCK_ZONES.map(([city, zone]) => {
    const time = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hour12: currentLang === 'en', timeZone: zone }).format(new Date());
    return `<div class="clock-row"><div><div class="clock-city">${cities[city] || city}</div><div class="clock-zone">${zone.replace(/_/g, ' ')}</div></div><div class="clock-time">${time}</div></div>`;
  }).join('');
}
// World clock interval — started only when the tools page is active.
let worldClockInterval = null;

/* Approximate average combined state + local sales tax (%).
   Source-style public averages — local rates vary; user can override Tax %. */
const SALES_TAX_RATES = {
  AL: 9.29, AK: 1.76, AZ: 8.40, AR: 9.51, CA: 8.85, CO: 7.77, CT: 6.35, DE: 0,
  DC: 6.00, FL: 7.01, GA: 7.38, HI: 4.44, ID: 6.03, IL: 8.86, IN: 7.00, IA: 6.94,
  KS: 8.70, KY: 6.00, LA: 9.56, ME: 5.50, MD: 6.00, MA: 6.25, MI: 6.00, MN: 7.49,
  MS: 7.07, MO: 8.29, MT: 0, NE: 6.94, NV: 8.23, NH: 0, NJ: 6.63, NM: 7.84,
  NY: 8.52, NC: 6.98, ND: 6.96, OH: 7.24, OK: 8.98, OR: 0, PA: 6.34, RI: 7.00,
  SC: 7.46, SD: 6.11, TN: 9.55, TX: 8.20, UT: 7.19, VT: 6.36, VA: 5.75, WA: 9.38,
  WV: 6.55, WI: 5.43, WY: 5.36
};
/* Localized U.S. state / DC names for the tip & sales-tax selector (en/es/zh/ja).
   Option values stay as ISO-style codes so tax rates never depend on display language. */
const US_STATE_NAMES = {
  en: {
    AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
    CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'Washington, D.C.',
    FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois',
    IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
    ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
    MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
    NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
    NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon',
    PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
    TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia',
    WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming'
  },
  es: {
    AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
    CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'Washington D. C.',
    FL: 'Florida', GA: 'Georgia', HI: 'Hawái', ID: 'Idaho', IL: 'Illinois',
    IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Luisiana',
    ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Míchigan', MN: 'Minnesota',
    MS: 'Misisipi', MO: 'Misuri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
    NH: 'Nuevo Hampshire', NJ: 'Nueva Jersey', NM: 'Nuevo México', NY: 'Nueva York',
    NC: 'Carolina del Norte', ND: 'Dakota del Norte', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregón',
    PA: 'Pensilvania', RI: 'Rhode Island', SC: 'Carolina del Sur', SD: 'Dakota del Sur',
    TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia',
    WA: 'Washington', WV: 'Virginia Occidental', WI: 'Wisconsin', WY: 'Wyoming'
  },
  zh: {
    AL: '阿拉巴马州', AK: '阿拉斯加州', AZ: '亚利桑那州', AR: '阿肯色州', CA: '加利福尼亚州',
    CO: '科罗拉多州', CT: '康涅狄格州', DE: '特拉华州', DC: '华盛顿哥伦比亚特区',
    FL: '佛罗里达州', GA: '佐治亚州', HI: '夏威夷州', ID: '爱达荷州', IL: '伊利诺伊州',
    IN: '印第安纳州', IA: '艾奥瓦州', KS: '堪萨斯州', KY: '肯塔基州', LA: '路易斯安那州',
    ME: '缅因州', MD: '马里兰州', MA: '马萨诸塞州', MI: '密歇根州', MN: '明尼苏达州',
    MS: '密西西比州', MO: '密苏里州', MT: '蒙大拿州', NE: '内布拉斯加州', NV: '内华达州',
    NH: '新罕布什尔州', NJ: '新泽西州', NM: '新墨西哥州', NY: '纽约州',
    NC: '北卡罗来纳州', ND: '北达科他州', OH: '俄亥俄州', OK: '俄克拉荷马州', OR: '俄勒冈州',
    PA: '宾夕法尼亚州', RI: '罗得岛州', SC: '南卡罗来纳州', SD: '南达科他州',
    TN: '田纳西州', TX: '得克萨斯州', UT: '犹他州', VT: '佛蒙特州', VA: '弗吉尼亚州',
    WA: '华盛顿州', WV: '西弗吉尼亚州', WI: '威斯康星州', WY: '怀俄明州'
  },
  ja: {
    AL: 'アラバマ州', AK: 'アラスカ州', AZ: 'アリゾナ州', AR: 'アーカンソー州', CA: 'カリフォルニア州',
    CO: 'コロラド州', CT: 'コネチカット州', DE: 'デラウェア州', DC: 'ワシントンD.C.',
    FL: 'フロリダ州', GA: 'ジョージア州', HI: 'ハワイ州', ID: 'アイダホ州', IL: 'イリノイ州',
    IN: 'インディアナ州', IA: 'アイオワ州', KS: 'カンザス州', KY: 'ケンタッキー州', LA: 'ルイジアナ州',
    ME: 'メイン州', MD: 'メリーランド州', MA: 'マサチューセッツ州', MI: 'ミシガン州', MN: 'ミネソタ州',
    MS: 'ミシシッピ州', MO: 'ミズーリ州', MT: 'モンタナ州', NE: 'ネブラスカ州', NV: 'ネバダ州',
    NH: 'ニューハンプシャー州', NJ: 'ニュージャージー州', NM: 'ニューメキシコ州', NY: 'ニューヨーク州',
    NC: 'ノースカロライナ州', ND: 'ノースダコタ州', OH: 'オハイオ州', OK: 'オクラホマ州', OR: 'オレゴン州',
    PA: 'ペンシルベニア州', RI: 'ロードアイランド州', SC: 'サウスカロライナ州', SD: 'サウスダコタ州',
    TN: 'テネシー州', TX: 'テキサス州', UT: 'ユタ州', VT: 'バーモント州', VA: 'バージニア州',
    WA: 'ワシントン州', WV: 'ウェストバージニア州', WI: 'ウィスコンシン州', WY: 'ワイオミング州'
  }
};

function getStateNames() {
  return US_STATE_NAMES[currentLang] || US_STATE_NAMES.en;
}

function stateNameLocale() {
  return currentLang === 'zh' ? 'zh-CN' : currentLang === 'ja' ? 'ja' : currentLang === 'es' ? 'es' : 'en';
}

const billAmount = document.getElementById('billAmount');
const taxRate = document.getElementById('taxRate');
const tipRate = document.getElementById('tipRate');
const tipResult = document.getElementById('tipResult');
const tipMeta = document.getElementById('tipMeta');
const salesTaxState = document.getElementById('salesTaxState');

function populateStateSelect() {
  if (!salesTaxState) return;
  const names = getStateNames();
  const prev = salesTaxState.value || 'CA';
  const locale = stateNameLocale();
  const codes = Object.keys(names).sort((a, b) => names[a].localeCompare(names[b], locale));
  salesTaxState.innerHTML = codes.map(code => {
    const rate = SALES_TAX_RATES[code] ?? 0;
    return `<option value="${code}">${names[code]} (~${rate.toFixed(2)}%)</option>`;
  }).join('');
  // Keep the user's state (and tax rate) when language changes; default CA on first fill.
  salesTaxState.value = names[prev] ? prev : 'CA';
  if (!salesTaxState.value) salesTaxState.value = 'CA';
}

function applyStateTaxRate() {
  if (!salesTaxState || !taxRate) return;
  const rate = SALES_TAX_RATES[salesTaxState.value];
  if (rate == null) return;
  taxRate.value = String(rate);
}

function updateTipEstimator() {
  if (!billAmount || !tipResult) return;
  const bill = Math.max(0, Number(billAmount.value) || 0);
  const taxPct = Math.max(0, Number(taxRate?.value) || 0);
  const tipPct = Math.max(0, Number(tipRate?.value) || 0);
  const tax = bill * taxPct / 100;
  const tip = bill * tipPct / 100;
  const total = bill + tax + tip;
  const t = toolsText();
  tipResult.textContent = moneyFmt(total, 'USD');
  if (tipMeta) {
    const names = getStateNames();
    const code = salesTaxState ? salesTaxState.value : '';
    const state = code ? (names[code] || code) : '';
    const tableRate = code ? SALES_TAX_RATES[code] : null;
    // Zero-tax message only for states with no statewide rate — not when the user manually zeros the field.
    const taxNote = (tableRate === 0 && taxPct === 0)
      ? (t.salesTaxZero || 'No statewide sales tax (local may apply).')
      : `${t.tax || 'Tax'} ${moneyFmt(tax, 'USD')} (${taxPct.toFixed(2)}%)`;
    tipMeta.textContent = [state, taxNote, `${t.tip || 'Tip'} ${moneyFmt(tip, 'USD')}`].filter(Boolean).join(' · ');
  }
}

// Combined tip + sales tax (one card)
populateStateSelect();
applyStateTaxRate();
if (salesTaxState) {
  salesTaxState.addEventListener('change', () => {
    applyStateTaxRate();
    updateTipEstimator();
  });
}
[billAmount, taxRate, tipRate].forEach(el => { if (el) el.addEventListener('input', updateTipEstimator); });
updateTipEstimator();
/* Road-trip cost: Gas (MPG / L/100km) or EV (mi/kWh / kWh/100km). */
const driveToolCard = document.getElementById('driveToolCard');
const driveDist = document.getElementById('driveDist');
const driveSpeed = document.getElementById('driveSpeed');
const driveMpg = document.getElementById('driveMpg');
const driveFuel = document.getElementById('driveFuel');
const driveEvEcon = document.getElementById('driveEvEcon');
const driveEvPrice = document.getElementById('driveEvPrice');
const driveResult = document.getElementById('driveResult');
const driveMeta = document.getElementById('driveMeta');
let driveMode = 'gas'; // 'gas' | 'ev'
// HTML field defaults are imperial (mi / MPG / mi/kWh / $/gal). Track last unit so toggles convert.
let driveFieldsUnit = 'mi';

function convertDriveInputsForUnitChange(fromUnit, toUnit) {
  if (!driveDist || fromUnit === toUnit) return;
  const toKm = toUnit === 'km';
  const fromKm = fromUnit === 'km';
  if (toKm === fromKm) return;
  const miToKm = 1.60934;
  const galToL = 3.78541;
  const round = (n, d) => {
    const f = Math.pow(10, d);
    return (Math.round(n * f) / f).toFixed(d);
  };
  const num = (el) => Math.max(0, Number(el && el.value) || 0);

  if (driveDist) {
    const v = num(driveDist);
    driveDist.value = toKm ? round(v * miToKm, 0) : round(v / miToKm, 0);
  }
  if (driveSpeed) {
    const v = Math.max(1, num(driveSpeed));
    driveSpeed.value = toKm ? round(v * miToKm, 0) : round(v / miToKm, 0);
  }
  // MPG ↔ L/100km  (L/100km = 235.215 / MPG)
  if (driveMpg) {
    const v = Math.max(0.1, num(driveMpg) || 0.1);
    driveMpg.value = round(235.215 / v, 1);
  }
  // mi/kWh ↔ kWh/100km  (kWh/100km = 100 / (mi/kWh × 1.60934))
  if (driveEvEcon) {
    const v = Math.max(0.1, num(driveEvEcon) || 0.1);
    driveEvEcon.value = round(100 / (v * miToKm), 1);
  }
  // $/gal ↔ $/L
  if (driveFuel) {
    const v = num(driveFuel);
    driveFuel.value = toKm ? round(v / galToL, 2) : round(v * galToL, 2);
  }
  driveFieldsUnit = toUnit;
  updateDriveUnitLabels();
}

/** Show only the active unit system on drive field labels (not dual “MPG / L/100km”). */
function updateDriveUnitLabels() {
  const t = toolsText();
  const imperial = currentDistUnit !== 'km';
  const mpgEl = document.getElementById('driveEconLabel');
  const fuelEl = document.getElementById('drivePriceLabel');
  const evEl = document.getElementById('driveEvEconLabel');
  if (mpgEl) mpgEl.textContent = imperial ? (t.driveMpgMi || 'MPG') : (t.driveMpgKm || 'L/100 km');
  if (fuelEl) fuelEl.textContent = imperial ? (t.driveFuelGal || 'Fuel $/gal') : (t.driveFuelL || 'Fuel $/L');
  if (evEl) evEl.textContent = imperial ? (t.driveEvMi || 'mi/kWh') : (t.driveEvKm || 'kWh/100 km');
}

function setDriveMode(mode) {
  driveMode = mode === 'ev' ? 'ev' : 'gas';
  if (driveToolCard) driveToolCard.setAttribute('data-drive-mode', driveMode);
  document.querySelectorAll('#driveToolCard .tool-seg-btn, .tool-seg [data-drive-type]').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-drive-type') === driveMode);
  });
  updateDriveCost();
}

function updateDriveCost() {
  if (!driveDist || !driveResult) return;
  const dist = Math.max(0, Number(driveDist.value) || 0);
  const speed = Math.max(1, Number(driveSpeed.value) || 1);
  const imperial = currentDistUnit !== 'km';
  const hours = dist / speed;
  let h = Math.floor(hours);
  let m = Math.round((hours - h) * 60);
  // Rounding can land on 60m (e.g. 0.999h → 0h 60m); roll into the next hour.
  if (m >= 60) { h += 1; m = 0; }
  const t = toolsText();
  const timeStr = h > 0 ? `${h}h ${m}m` : `${m}m`;
  const distUnit = imperial ? 'mi' : 'km';
  let cost = 0;
  let energyLine = '';

  if (driveMode === 'ev') {
    const econ = Math.max(0.1, Number(driveEvEcon?.value) || 0.1);
    const price = Math.max(0, Number(driveEvPrice?.value) || 0);
    let kwh;
    if (imperial) {
      // econ = mi/kWh
      kwh = dist / econ;
    } else {
      // econ = kWh/100km
      kwh = (econ / 100) * dist;
    }
    cost = kwh * price;
    energyLine = `${kwh.toFixed(1)} kWh · $${price.toFixed(2)}/kWh`;
  } else {
    const economy = Math.max(0.1, Number(driveMpg?.value) || 0.1);
    const price = Math.max(0, Number(driveFuel?.value) || 0);
    let fuelAmt;
    if (imperial) {
      fuelAmt = dist / economy; // gallons
    } else {
      fuelAmt = (economy / 100) * dist; // liters
    }
    cost = fuelAmt * price;
    const fuelUnit = imperial ? (t.driveGal || 'gal') : (t.driveL || 'L');
    energyLine = `${fuelAmt.toFixed(1)} ${fuelUnit}`;
  }

  driveResult.textContent = `${timeStr} · ${moneyFmt(cost, 'USD')}`;
  driveMeta.textContent = `${dist.toLocaleString()} ${distUnit} · ${energyLine} · ~${speed} ${distUnit}/h`;
}

document.querySelectorAll('[data-drive-type]').forEach(btn => {
  btn.addEventListener('click', () => setDriveMode(btn.getAttribute('data-drive-type')));
});
[driveDist, driveSpeed, driveMpg, driveFuel, driveEvEcon, driveEvPrice].forEach(el => {
  if (el) el.addEventListener('input', updateDriveCost);
});
if (driveToolCard) setDriveMode('gas');
// If the user prefers metric (or OS default is km), convert imperial HTML defaults once.
if (driveDist && currentDistUnit === 'km' && driveFieldsUnit === 'mi') {
  convertDriveInputsForUnitChange('mi', 'km');
}
updateDriveUnitLabels();

// Tools mini-app: start live widgets immediately (page is always "open").
if (document.body.classList.contains('page-tools') || currencyAmount || worldClockList) {
  refreshToolsLive();
  if (worldClockList) {
    if (worldClockInterval) clearInterval(worldClockInterval);
    worldClockInterval = setInterval(updateWorldClock, 30000);
  }
  // Reveal tool cards without waiting for scroll (above-the-fold mini-app).
  document.querySelectorAll('#tools .reveal, .tools-page .reveal').forEach(el => {
    el.classList.add('visible');
  });
}
