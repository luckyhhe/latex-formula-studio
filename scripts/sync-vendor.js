// 从 node_modules 同步 KaTeX / MathLive 运行时资源到 renderer/vendor
// 这些是第三方库的分发产物，不纳入版本管理（见 .gitignore），
// 由 postinstall 钩子自动执行，也可手动运行：npm run sync-vendor
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

function copyFile(src, dst) {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
}
function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name);
    const d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d);
    else copyFile(s, d);
  }
}

const jobs = [
  // KaTeX
  ['node_modules/katex/dist/katex.min.css', 'renderer/vendor/katex/katex.min.css'],
  ['node_modules/katex/dist/katex.min.js', 'renderer/vendor/katex/katex.min.js'],
  ['node_modules/katex/dist/fonts', 'renderer/vendor/katex/fonts'],
  ['node_modules/katex/LICENSE', 'renderer/vendor/katex/LICENSE.txt'],
  // MathLive
  ['node_modules/mathlive/mathlive.min.js', 'renderer/vendor/mathlive/mathlive.min.js'],
  ['node_modules/mathlive/mathlive-static.css', 'renderer/vendor/mathlive/mathlive-static.css'],
  ['node_modules/mathlive/mathlive-fonts.css', 'renderer/vendor/mathlive/mathlive-fonts.css'],
  ['node_modules/mathlive/fonts', 'renderer/vendor/mathlive/fonts'],
  ['node_modules/mathlive/LICENSE.txt', 'renderer/vendor/mathlive/LICENSE.txt']
];

let allOk = true;
for (const [s, d] of jobs) {
  const src = path.join(root, s);
  const dst = path.join(root, d);
  if (!fs.existsSync(src)) {
    console.warn('缺少 ' + s + '（已跳过，请确认 npm install 已完成）');
    allOk = false;
    continue;
  }
  if (fs.statSync(src).isDirectory()) copyDir(src, dst);
  else copyFile(src, dst);
}
console.log(allOk ? 'vendor 渲染资源已同步 ✓' : 'vendor 部分资源缺失');
