/* ============ LaTeX Formula Studio —— 渲染进程逻辑（所见即所得版） ============ */
'use strict';

const PH = '□'; // 模板占位符（插入时转换为 MathLive 的 #?）

/* ---------- 结构模板（顶部 chips） ---------- */
const TEMPLATES = [
  { name: '分式',   demo: '\\frac{a}{b}',                 ins: '\\frac{□}{□}' },
  { name: '根式',   demo: '\\sqrt{x}',                    ins: '\\sqrt{□}' },
  { name: 'n 次根', demo: '\\sqrt[n]{x}',                 ins: '\\sqrt[□]{□}' },
  { name: '上标',   demo: 'x^{2}',                        ins: '^{□}' },
  { name: '下标',   demo: 'x_{i}',                        ins: '_{□}' },
  { name: '上下标', demo: 'x_{i}^{2}',                    ins: '_{□}^{□}' },
  { name: '求和',   demo: '\\sum_{i=1}^{n}',              ins: '\\sum_{□}^{□}' },
  { name: '积分',   demo: '\\int_{a}^{b}',                ins: '\\int_{□}^{□}' },
  { name: '极限',   demo: '\\lim_{x\\to0}',               ins: '\\lim_{□\\to□}' },
  { name: '二项式', demo: '\\binom{n}{k}',                ins: '\\binom{□}{□}' },
  { name: '导数',   demo: '\\frac{\\mathrm{d}y}{\\mathrm{d}x}', ins: '\\frac{\\mathrm{d}□}{\\mathrm{d}□}' },
  { name: '偏导',   demo: '\\frac{\\partial f}{\\partial x}',   ins: '\\frac{\\partial□}{\\partial□}' },
  { name: '圆括号', demo: '\\left(x\\right)',             ins: '\\left(□\\right)' },
  { name: '花括号', demo: '\\left\\{x\\right\\}',         ins: '\\left\\{□\\right\\}' },
  { name: '绝对值', demo: '\\left|x\\right|',             ins: '\\left|□\\right|' },
  { name: '矩阵',   demo: '\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}', ins: '\\begin{pmatrix}□&□\\\\□&□\\end{pmatrix}' },
  { name: '方程组', demo: '\\begin{cases}a\\\\b\\end{cases}',        ins: '\\begin{cases}□\\\\□\\end{cases}' },
  { name: '向量',   demo: '\\vec{v}',                     ins: '\\vec{□}' }
];

/* ---------- 符号面板分类 ---------- */
const S = (t, d, wide) => ({ t, d: d || t, wide: !!wide });
const CATS = [
  { name: '常用', syms: [
    S('\\pm'), S('\\mp'), S('\\times'), S('\\div'), S('\\cdot'), S('\\neq'),
    S('\\approx'), S('\\equiv'), S('\\leq'), S('\\geq'), S('\\ll'), S('\\gg'),
    S('\\infty'), S('\\propto'), S('\\sim'), S('^{\\circ}', 'x^{\\circ}'),
    S('\\therefore'), S('\\because'), S('\\in'), S('\\notin'), S('\\subset'), S('\\subseteq'),
    S('\\cup'), S('\\cap'), S('\\forall'), S('\\exists'), S('\\varnothing'), S('\\partial'),
    S('\\nabla'), S('\\ldots'), S('\\cdots'), S('\\vdots'), S('\\ddots'),
    S('\\sqrt{□}', '\\sqrt{x}'), S('\\sum'), S('\\prod'), S('\\int'),
    S('\\mathbb{R}'), S('\\mathbb{N}'), S('\\mathbb{Z}'), S('\\mathbb{Q}'), S('\\mathbb{C}')
  ]},
  { name: '希腊小写', syms: [
    S('\\alpha'), S('\\beta'), S('\\gamma'), S('\\delta'), S('\\epsilon'), S('\\varepsilon'),
    S('\\zeta'), S('\\eta'), S('\\theta'), S('\\vartheta'), S('\\iota'), S('\\kappa'),
    S('\\lambda'), S('\\mu'), S('\\nu'), S('\\xi'), S('\\pi'), S('\\varpi'),
    S('\\rho'), S('\\varrho'), S('\\sigma'), S('\\varsigma'), S('\\tau'), S('\\upsilon'),
    S('\\phi'), S('\\varphi'), S('\\chi'), S('\\psi'), S('\\omega')
  ]},
  { name: '希腊大写', syms: [
    S('\\Gamma'), S('\\Delta'), S('\\Theta'), S('\\Lambda'), S('\\Xi'), S('\\Pi'),
    S('\\Sigma'), S('\\Upsilon'), S('\\Phi'), S('\\Psi'), S('\\Omega')
  ]},
  { name: '关系符', syms: [
    S('='), S('\\neq'), S('\\approx'), S('\\equiv'), S('\\cong'), S('\\simeq'),
    S('\\sim'), S('<'), S('>'), S('\\leq'), S('\\geq'), S('\\ll'),
    S('\\gg'), S('\\prec'), S('\\succ'), S('\\preceq'), S('\\succeq'), S('\\propto'),
    S('\\perp'), S('\\parallel'), S('\\mid'), S('\\nmid'), S('\\in'), S('\\ni'),
    S('\\notin'), S('\\subset'), S('\\supset'), S('\\subseteq'), S('\\supseteq'), S('\\nsubseteq'),
    S('\\cup'), S('\\cap'), S('\\setminus'), S('\\vdash'), S('\\models')
  ]},
  { name: '运算符', syms: [
    S('+'), S('-'), S('\\pm'), S('\\mp'), S('\\times'), S('\\div'),
    S('\\cdot'), S('\\ast'), S('\\star'), S('\\circ'), S('\\bullet'), S('\\oplus'),
    S('\\ominus'), S('\\otimes'), S('\\oslash'), S('\\odot'), S('\\bigoplus'), S('\\bigotimes'),
    S('\\wedge'), S('\\vee'), S('\\neg'), S('\\cap'), S('\\cup'), S('\\sqcap'),
    S('\\bmod', 'a\\bmod b'), S('\\cdotp'), S('\\prime'), S('\\backprime'), S('\\dagger'), S('\\ddagger')
  ]},
  { name: '箭头', syms: [
    S('\\to'), S('\\gets'), S('\\rightarrow'), S('\\leftarrow'), S('\\leftrightarrow'), S('\\mapsto'),
    S('\\Rightarrow'), S('\\Leftarrow'), S('\\Leftrightarrow'), S('\\longrightarrow'), S('\\longleftarrow'), S('\\longleftrightarrow'),
    S('\\Longrightarrow'), S('\\Longleftarrow'), S('\\uparrow'), S('\\downarrow'), S('\\updownarrow'), S('\\nearrow'),
    S('\\searrow'), S('\\nwarrow'), S('\\swarrow'), S('\\hookrightarrow'), S('\\rightleftharpoons'), S('\\rightharpoonup'),
    S('\\xrightarrow{□}', '\\xrightarrow{f}'), S('\\xleftarrow{□}', '\\xleftarrow{f}')
  ]},
  { name: '定界符', syms: [
    S('('), S(')'), S('['), S(']'), S('\\{'), S('\\}'),
    S('\\langle'), S('\\rangle'), S('|'), S('\\|'), S('\\lceil'), S('\\rceil'),
    S('\\lfloor'), S('\\rfloor'),
    S('\\left(□\\right)', '\\left(x\\right)', true), S('\\left[□\\right]', '\\left[x\\right]', true),
    S('\\left\\{□\\right\\}', '\\left\\{x\\right\\}', true), S('\\left|□\\right|', '\\left|x\\right|', true),
    S('\\left\\|□\\right\\|', '\\left\\|x\\right\\|', true), S('\\left\\langle□\\right\\rangle', '\\left\\langle x\\right\\rangle', true)
  ]},
  { name: '函数', syms: [
    S('\\sin'), S('\\cos'), S('\\tan'), S('\\cot'), S('\\sec'), S('\\csc'),
    S('\\arcsin'), S('\\arccos'), S('\\arctan'), S('\\sinh'), S('\\cosh'), S('\\tanh'),
    S('\\log'), S('\\ln'), S('\\lg'), S('\\exp'), S('\\lim'), S('\\sup'),
    S('\\inf'), S('\\limsup'), S('\\liminf'), S('\\max'), S('\\min'), S('\\arg'),
    S('\\det'), S('\\dim'), S('\\ker'), S('\\deg'), S('\\Pr'), S('\\gcd')
  ]},
  { name: '标注字体', syms: [
    S('\\hat{□}', '\\hat{x}'), S('\\bar{□}', '\\bar{x}'), S('\\tilde{□}', '\\tilde{x}'),
    S('\\vec{□}', '\\vec{x}'), S('\\dot{□}', '\\dot{x}'), S('\\ddot{□}', '\\ddot{x}'),
    S('\\overline{□}', '\\overline{x}'), S('\\underline{□}', '\\underline{x}'),
    S('\\widehat{□}', '\\widehat{xy}'), S('\\widetilde{□}', '\\widetilde{xy}'),
    S('\\overrightarrow{□}', '\\overrightarrow{AB}'), S('\\overleftarrow{□}', '\\overleftarrow{AB}'),
    S('\\overbrace{□}', '\\overbrace{x+y}'), S('\\underbrace{□}', '\\underbrace{x+y}'),
    S('\\cancel{□}', '\\cancel{x}'), S('\\boxed{□}', '\\boxed{x}'),
    S('\\mathbf{□}', '\\mathbf{x}'), S('\\mathbb{□}', '\\mathbb{R}'), S('\\mathcal{□}', '\\mathcal{L}'),
    S('\\mathrm{□}', '\\mathrm{d}'), S('\\boldsymbol{□}', '\\boldsymbol{\\beta}'), S('\\text{□}', '\\text{文本}'),
    S('\\color{red}{□}', '\\color{red}{x}')
  ]},
  { name: '矩阵', syms: [
    S('\\begin{matrix}□&□\\\\□&□\\end{matrix}', '\\begin{matrix}a&b\\\\c&d\\end{matrix}', true),
    S('\\begin{pmatrix}□&□\\\\□&□\\end{pmatrix}', '\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}', true),
    S('\\begin{bmatrix}□&□\\\\□&□\\end{bmatrix}', '\\begin{bmatrix}a&b\\\\c&d\\end{bmatrix}', true),
    S('\\begin{Bmatrix}□&□\\\\□&□\\end{Bmatrix}', '\\begin{Bmatrix}a&b\\\\c&d\\end{Bmatrix}', true),
    S('\\begin{vmatrix}□&□\\\\□&□\\end{vmatrix}', '\\begin{vmatrix}a&b\\\\c&d\\end{vmatrix}', true),
    S('\\begin{Vmatrix}□&□\\\\□&□\\end{Vmatrix}', '\\begin{Vmatrix}a&b\\\\c&d\\end{Vmatrix}', true),
    S('\\begin{pmatrix}□&□&□\\\\□&□&□\\\\□&□&□\\end{pmatrix}', '\\begin{pmatrix}a&b&c\\\\d&e&f\\\\g&h&i\\end{pmatrix}', true),
    S('\\begin{cases}□&□\\\\□&□\\end{cases}', '\\begin{cases}a&x>0\\\\b&x<0\\end{cases}', true),
    S('\\begin{aligned}□&=□\\\\□&=□\\end{aligned}', '\\begin{aligned}x&=a\\\\y&=b\\end{aligned}', true)
  ]},
  { name: '求和积分', syms: [
    S('\\sum_{□}^{□}', '\\sum_{i=1}^{n}', true), S('\\prod_{□}^{□}', '\\prod_{i=1}^{n}', true),
    S('\\bigcup_{□}^{□}', '\\bigcup_{i=1}^{n}', true), S('\\bigcap_{□}^{□}', '\\bigcap_{i=1}^{n}', true),
    S('\\bigvee'), S('\\bigwedge'), S('\\bigoplus'), S('\\bigotimes'),
    S('\\int_{□}^{□}', '\\int_{a}^{b}', true), S('\\iint_{□}', '\\iint_{D}', true),
    S('\\iiint_{□}', '\\iiint_{V}', true), S('\\oint_{□}', '\\oint_{C}', true),
    S('\\lim_{□\\to□}', '\\lim_{x\\to0}', true)
  ]}
];

/* ---------- 常用公式示例 ---------- */
const EXAMPLES = [
  { name: '勾股定理',     tex: 'a^2 + b^2 = c^2' },
  { name: '二次求根公式', tex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}' },
  { name: '欧拉恒等式',   tex: 'e^{i\\pi} + 1 = 0' },
  { name: '微积分基本定理', tex: '\\int_a^b f\'(x)\\,\\mathrm{d}x = f(b) - f(a)' },
  { name: '泰勒展开',     tex: 'f(x) = \\sum_{n=0}^{\\infty} \\frac{f^{(n)}(a)}{n!}(x-a)^n' },
  { name: '正态分布密度', tex: 'f(x) = \\frac{1}{\\sqrt{2\\pi}\\,\\sigma} e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}' },
  { name: '贝叶斯公式',   tex: 'P(A\\mid B) = \\frac{P(B\\mid A)\\,P(A)}{P(B)}' },
  { name: '二项式定理',   tex: '(a+b)^n = \\sum_{k=0}^{n} \\binom{n}{k} a^{n-k} b^k' },
  { name: '柯西-施瓦茨',  tex: '\\left|\\langle u, v \\rangle\\right|^2 \\leq \\langle u, u \\rangle \\cdot \\langle v, v \\rangle' },
  { name: '特征值方程',   tex: 'A\\vec{v} = \\lambda \\vec{v}' },
  { name: '薛定谔方程',   tex: 'i\\hbar \\frac{\\partial}{\\partial t} \\Psi = \\hat{H} \\Psi' },
  { name: '高斯定律',     tex: '\\nabla \\cdot \\mathbf{E} = \\frac{\\rho}{\\varepsilon_0}' }
];

/* ---------- DOM ---------- */
const $ = (id) => document.getElementById(id);
const mf = $('mf'), mfStage = $('mfStage'), mfGhost = $('mfGhost');
const srcWrap = $('srcWrap'), srcEditor = $('srcEditor');
const outEl = $('out');
const chipsEl = $('chips'), segTabsEl = $('segTabs'), symGridEl = $('symGrid');
const libListEl = $('libList'), toastEl = $('toast');

const hasApi = typeof window.api !== 'undefined';

/* ---------- 状态 ---------- */
const state = { fsize: 24, cat: 0, libTab: 'history' };

/* ---------- MathLive 初始化 ---------- */
mf.smartMode = true;                  // 智能模式：sin、lim 等自动直立
mf.smartFence = true;                 // 括号自动配对
mf.smartSuperscript = true;
mf.letterShapeStyle = 'tex';          // TeX 风格斜体
mf.removeExtraneousParentheses = true;
mf.mathVirtualKeyboardPolicy = 'manual';
mf.defaultMode = 'math';

/* ---------- Toast ---------- */
let toastTimer = null;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1800);
}

/* ---------- 主题 ---------- */
const rootEl = document.documentElement;
const SUN_SVG = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M19.1 4.9l-1.6 1.6M6.5 17.5l-1.6 1.6"/></svg>';
const MOON_SVG = '<svg viewBox="0 0 24 24"><path class="fillable" d="M20.2 14.2A8.5 8.5 0 0 1 9.8 3.8a8.5 8.5 0 1 0 10.4 10.4z"/></svg>';
function applyTheme(t) {
  rootEl.dataset.theme = t;
  $('btnTheme').innerHTML = t === 'dark' ? SUN_SVG : MOON_SVG;
  localStorage.setItem('lfs.theme', t);
}
(function initTheme() {
  let t = localStorage.getItem('lfs.theme');
  if (!t) t = (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
  applyTheme(t);
})();
$('btnTheme').addEventListener('click', () => {
  applyTheme(rootEl.dataset.theme === 'dark' ? 'light' : 'dark');
});

/* ---------- 显示用 LaTeX（剥离占位符标记） ---------- */
function displayTex() {
  return (mf.value || '').replace(/\\placeholder\{\}/g, '');
}
function currentTex() { return displayTex().trim(); }

function setOut(tex) {
  if (tex.trim()) outEl.textContent = tex;
  else outEl.innerHTML = '<span class="out-placeholder">生成的 LaTeX 代码会显示在这里</span>';
}

/* ---------- 同步：公式场 → 输出 / 源码 / 历史 ---------- */
let syncing = false;
function updateGhost() {
  const empty = !(mf.value || '').trim();
  mfGhost.style.display = (empty && document.activeElement !== mf) ? 'flex' : 'none';
}
function syncFromField() {
  if (syncing) return;
  syncing = true;
  const tex = displayTex();
  if (srcEditor.value !== tex) srcEditor.value = tex;
  setOut(tex);
  updateGhost();
  syncing = false;
  scheduleHistory();
}
mf.addEventListener('input', syncFromField);
mf.addEventListener('focus', updateGhost);
mf.addEventListener('blur', updateGhost);
mfStage.addEventListener('mousedown', (e) => {
  if (e.target !== mf && !mf.contains(e.target)) mf.focus();
});

/* ---------- 同步：源码 → 公式场（双向） ---------- */
srcEditor.addEventListener('input', () => {
  if (syncing) return;
  syncing = true;
  try { mf.setValue(srcEditor.value, { suppressChangeNotifications: true }); } catch (e) { /* 容忍中间态 */ }
  syncing = false;
  setOut(displayTex());
  updateGhost();
  scheduleHistory();
});

/* ---------- 插入模板 / 符号到光标处 ---------- */
function insertSnippet(snip) {
  mf.focus();
  let out = snip;
  let collapsed = true;
  try { collapsed = mf.selectionIsCollapsed(); } catch (e) { /* ignore */ }
  if (!collapsed) out = out.replace(PH, '#@');   // 有选区时把选区放进第一个占位符
  out = out.split(PH).join('#?');
  const opts = { insertionMode: 'replaceSelection', selectionMode: 'placeholder', format: 'latex' };
  try {
    if (typeof mf.insert === 'function') mf.insert(out, opts);
    else mf.executeCommand(['insert', out, opts]);
  } catch (e) {
    try { mf.executeCommand(['insert', out, opts]); } catch (e2) { /* ignore */ }
  }
  syncFromField();
}

/* ---------- 渲染：结构模板 ---------- */
TEMPLATES.forEach((t) => {
  const chip = document.createElement('button');
  chip.className = 'chip';
  chip.title = t.ins.split(PH).join('…');
  const demo = document.createElement('span');
  demo.className = 'demo';
  katex.render(t.demo, demo, { throwOnError: false });
  const name = document.createElement('span');
  name.className = 'name';
  name.textContent = t.name;
  chip.appendChild(demo); chip.appendChild(name);
  chip.addEventListener('click', () => insertSnippet(t.ins));
  chipsEl.appendChild(chip);
});

/* ---------- 渲染：符号面板 ---------- */
CATS.forEach((c, i) => {
  const b = document.createElement('button');
  b.className = 'seg-tab' + (i === 0 ? ' on' : '');
  b.textContent = c.name;
  b.addEventListener('click', () => {
    state.cat = i;
    segTabsEl.querySelectorAll('.seg-tab').forEach((el, k) => el.classList.toggle('on', k === i));
    renderGrid();
  });
  segTabsEl.appendChild(b);
});
let symTotal = 0;
CATS.forEach(c => symTotal += c.syms.length);
$('symCount').textContent = CATS.length + ' 类 · ' + symTotal + ' 个符号';

function renderGrid() {
  symGridEl.innerHTML = '';
  CATS[state.cat].syms.forEach((s) => {
    const b = document.createElement('button');
    b.className = 'sym' + (s.wide ? ' wide' : '');
    b.title = s.t.split(PH).join('…');
    katex.render(s.d, b, { throwOnError: false });
    b.addEventListener('click', () => insertSnippet(s.t));
    symGridEl.appendChild(b);
  });
}
renderGrid();

/* ---------- 快捷键：Ctrl + Enter 复制 ---------- */
mf.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    copyRaw();
  }
}, true);

/* ---------- 行内 / 行间 与 字号 ---------- */
function applyFontSize() {
  rootEl.style.setProperty('--pfs', state.fsize + 'px');
}
$('modeSeg').querySelectorAll('button').forEach((b) => {
  b.addEventListener('click', () => {
    state.fsize = b.dataset.m === '1' ? 34 : 24;
    $('modeSeg').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
    applyFontSize();
  });
});
$('fontMinus').addEventListener('click', () => { state.fsize = Math.max(18, state.fsize - 4); applyFontSize(); });
$('fontPlus').addEventListener('click', () => { state.fsize = Math.min(44, state.fsize + 4); applyFontSize(); });
applyFontSize();

/* ---------- 源码抽屉 ---------- */
$('btnSrc').addEventListener('click', () => {
  const open = srcWrap.classList.toggle('open');
  $('btnSrc').classList.toggle('on', open);
  if (open) {
    srcEditor.value = displayTex();
    srcEditor.focus();
  } else {
    mf.focus();
  }
});

/* ---------- 清空 ---------- */
$('btnClear').addEventListener('click', () => {
  try { mf.setValue(''); } catch (e) { mf.value = ''; }
  mf.focus();
  syncFromField();
});

/* ---------- 复制 / 导出 ---------- */
function copyTextFallback(t) {
  if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t);
  return Promise.reject(new Error('no clipboard'));
}
function doCopy(text, label) {
  if (!text) { toast('请先输入公式'); return; }
  const done = () => toast(label || '已复制 ✓');
  if (hasApi) { window.api.copyText(text); done(); }
  else copyTextFallback(text).then(done, () => toast('复制失败'));
}
function copyRaw() { doCopy(currentTex(), '已复制 LaTeX 代码 ✓'); }
$('copyRaw').addEventListener('click', copyRaw);
$('copyInline').addEventListener('click', () => {
  const t = currentTex(); if (t) doCopy('$' + t + '$', '已复制行内公式 ✓'); else toast('请先输入公式');
});
$('copyDisplay').addEventListener('click', () => {
  const t = currentTex(); if (t) doCopy('$$\n' + t + '\n$$', '已复制行间公式 ✓'); else toast('请先输入公式');
});

function stageRect() {
  const r = mfStage.getBoundingClientRect();
  const pad = 14;
  const x = Math.max(0, Math.floor(r.left - pad));
  const y = Math.max(0, Math.floor(r.top - pad));
  const right = Math.min(window.innerWidth, Math.ceil(r.right + pad));
  const bottom = Math.min(window.innerHeight, Math.ceil(r.bottom + pad));
  return { x, y, width: Math.max(1, right - x), height: Math.max(1, bottom - y) };
}
async function captureStage() {
  mf.blur();                       // 先隐藏光标，避免截进图片
  await new Promise(r => setTimeout(r, 120));
  return stageRect();
}
$('exportPng').addEventListener('click', async () => {
  if (!currentTex()) { toast('请先输入公式'); return; }
  if (!hasApi) { toast('当前环境不支持导出'); return; }
  const rect = await captureStage();
  const res = await window.api.exportPNG(rect);
  mf.focus();
  if (res && res.saved) toast('已保存 PNG ✓');
  else if (res && res.error) toast('导出失败');
});
$('copyImg').addEventListener('click', async () => {
  if (!currentTex()) { toast('请先输入公式'); return; }
  if (!hasApi) { toast('当前环境不支持'); return; }
  const rect = await captureStage();
  const ok = await window.api.copyImage(rect);
  mf.focus();
  toast(ok ? '图片已复制，可直接粘贴 ✓' : '复制失败');
});

/* ---------- 历史记录 / 常用公式 ---------- */
const HKEY = 'lfs.history.v1';
let historyList = [];
try { historyList = JSON.parse(localStorage.getItem(HKEY) || '[]'); } catch (e) { historyList = []; }

let histTimer = null;
function scheduleHistory() {
  clearTimeout(histTimer);
  histTimer = setTimeout(() => {
    const tex = currentTex();
    if (!tex || tex.length < 4) return;
    if (historyList[0] === tex) return;
    historyList = historyList.filter(t => t !== tex);
    historyList.unshift(tex);
    if (historyList.length > 24) historyList.length = 24;
    localStorage.setItem(HKEY, JSON.stringify(historyList));
    if (state.libTab === 'history') renderLib();
  }, 1800);
}

function loadFormula(tex) {
  try { mf.setValue(tex); } catch (e) { mf.value = tex; }
  mf.focus();
  try { mf.executeCommand('moveToMathFieldEnd'); } catch (e) { /* ignore */ }
  syncFromField();
  toast('已载入公式');
}

function renderLib() {
  libListEl.innerHTML = '';
  if (state.libTab === 'history') {
    if (!historyList.length) {
      libListEl.innerHTML = '<div class="lib-empty">暂无历史记录 —— 写个公式试试，自动保存最近 24 条</div>';
      return;
    }
    historyList.forEach((tex, idx) => {
      const item = document.createElement('div');
      item.className = 'lib-item';
      const k = document.createElement('span');
      k.className = 'k';
      katex.render(tex, k, { throwOnError: false });
      const del = document.createElement('button');
      del.className = 'del'; del.textContent = '×'; del.title = '删除';
      del.addEventListener('click', (e) => {
        e.stopPropagation();
        historyList.splice(idx, 1);
        localStorage.setItem(HKEY, JSON.stringify(historyList));
        renderLib();
      });
      item.appendChild(k); item.appendChild(del);
      item.addEventListener('click', () => loadFormula(tex));
      libListEl.appendChild(item);
    });
  } else {
    EXAMPLES.forEach((ex) => {
      const item = document.createElement('div');
      item.className = 'lib-item';
      const k = document.createElement('span');
      k.className = 'k';
      katex.render(ex.tex, k, { throwOnError: false });
      const tag = document.createElement('span');
      tag.className = 'tag'; tag.textContent = ex.name;
      item.appendChild(k); item.appendChild(tag);
      item.addEventListener('click', () => loadFormula(ex.tex));
      libListEl.appendChild(item);
    });
  }
}
$('libSeg').querySelectorAll('button').forEach((b) => {
  b.addEventListener('click', () => {
    state.libTab = b.dataset.t;
    $('libSeg').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
    $('clearHistory').style.visibility = state.libTab === 'history' ? 'visible' : 'hidden';
    renderLib();
  });
});
$('clearHistory').addEventListener('click', () => {
  historyList = [];
  localStorage.setItem(HKEY, '[]');
  renderLib();
  toast('历史已清空');
});
renderLib();

/* ---------- 窗口控制 ---------- */
if (hasApi) {
  $('btnClose').addEventListener('click', () => window.api.close());
  $('btnMin').addEventListener('click', () => window.api.minimize());
  $('btnMax').addEventListener('click', () => window.api.toggleMaximize());
  $('titlebar').addEventListener('dblclick', (e) => {
    if (e.target.closest('button')) return;
    window.api.toggleMaximize();
  });
}

/* ---------- 初始渲染 ---------- */
syncFromField();
updateGhost();
