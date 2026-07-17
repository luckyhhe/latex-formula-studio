# LaTeX Formula Studio

🍎 苹果风 LaTeX 公式生成器 —— **所见即所得**的桌面公式编辑器（类 MathType / Word 公式体验），完全离线、免安装、免管理员权限。

![License](https://img.shields.io/badge/license-MIT-blue)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)
![Electron](https://img.shields.io/badge/Electron-37-47848f)
![MathLive](https://img.shields.io/badge/MathLive-0.110-orange)

## ✨ 特性

- **所见即所得编辑**：编辑区就是排版好的公式本身，鼠标点哪里改哪里，方向键在公式结构中移动（基于 MathLive）
- **模板与符号面板**：18 种结构模板 + 11 类 268 个符号，点击插入到光标处，按 Tab 在占位方框间跳转（MathType 同款体验）
- **键盘魔术**：输入 `/` 自动变分式、`^` / `_` 自动生成上下标、`\alpha` + 空格自动变 α、`sin`/`lim` 自动直立、括号自动配对
- **LaTeX 实时输出**：代码自动生成，一键复制 纯代码 / `$…$` / `$$…$$`，Ctrl+Enter 快速复制
- **源码双向同步**：`</> 源码` 抽屉与公式实时互相同步，高级用户可直接粘贴、编辑 LaTeX
- **图片输出**：复制图片到剪贴板 / 导出 PNG（可直接粘贴进 Word、PPT）
- **公式库**：自动保存最近 24 条历史记录；内置 12 条常用公式一键载入
- **苹果风界面**：浅色 / 深色双主题，自绘红绿灯窗口按钮，圆角卡片与细腻动效
- **绿色便携**：完全离线运行，不联网、不写注册表、解压即用

## 📦 下载（Windows 便携版）

前往 [**Releases**](https://github.com/luckyhhe/latex-formula-studio/releases) 下载压缩包，解压到任意位置后双击 **`LaTeX Formula Studio.exe`** 即可 —— 无需安装、无需管理员权限。

> 💡 粘贴到 Word：插入公式 → 左上角切换为「LaTeX」模式 → 粘贴代码即可转成 Word 公式。

## 🚀 从源码运行

```bash
git clone https://github.com/luckyhhe/latex-formula-studio.git
cd latex-formula-studio
npm install     # 自动同步 KaTeX / MathLive 渲染资源（postinstall 钩子）
npm start
```

## 🛠 开发

### 项目结构

```
├── main.js                 # Electron 主进程（窗口、IPC、PNG 导出、冒烟测试钩子）
├── preload.js              # 预加载脚本（受控 API 桥）
├── renderer/
│   ├── index.html          # 界面骨架
│   ├── styles.css          # Apple 风样式（浅色/深色）
│   ├── app.js              # 交互逻辑（模板/符号数据、同步、复制、历史）
│   └── vendor/             # KaTeX / MathLive 运行时（postinstall 生成，不入库）
├── scripts/
│   └── sync-vendor.js      # vendor 资源同步脚本
└── package.json
```

### 常用脚本

| 命令 | 说明 |
| --- | --- |
| `npm start` | 启动应用 |
| `npm run sync-vendor` | 手动同步 vendor 渲染资源 |
| `npm run smoke` | 冒烟测试（自动截图 + 交互断言，macOS / Linux） |
| `npm run pack:win` | 打包 Windows x64 便携版到 `dist/` |
| `npm run pack:mac` | 打包 macOS（arm64 + x64） |
| `npm run pack:linux` | 打包 Linux x64 |

- Linux 下跑冒烟测试需要虚拟显示：`SMOKE_TEST=1 xvfb-run -a npx electron . --no-sandbox`
- 在 Linux 上交叉打包 Windows 版无需 wine（未配置 exe 图标，不触发 rcedit）；Electron 二进制可用镜像加速：`ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/" npm run pack:win`

## 🧱 技术栈与致谢

- [Electron](https://www.electronjs.org/) —— 跨平台桌面容器（MIT）
- [MathLive](https://mathlive.io/) —— 所见即所得数学输入组件（MIT）
- [KaTeX](https://katex.org/) —— 高速公式渲染（MIT）

## 📄 开源协议

[MIT](LICENSE) © 2026 luckyhhe

---

**English**: An Apple-style, fully offline LaTeX formula generator for the desktop with WYSIWYG editing (MathType / Word-equation-like experience). Portable — no installation or admin rights required. Built with Electron + MathLive + KaTeX. MIT licensed.
