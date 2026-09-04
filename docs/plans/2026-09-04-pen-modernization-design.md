# Pen 现代化改造设计

日期：2026-09-04
状态：已与维护者确认通过

## 背景

Pen 是一个本地 markdown 预览 CLI 工具（Express + socket.io + chokidar 服务端，remark/rehype 渲染管线，React SSR + mobx 客户端）。当前依赖停留在 2022 年前后：Vite 3、React 18、TS 4.5、ESLint 7、express 4、unified 10 系，UI 使用 MUI 5 + emotion（实际只用到了 Drawer/TreeView/Breadcrumbs/Snackbar/Switch/Skeleton 等少量组件）。CI workflow 引用已改名的配置文件，处于损坏状态。

### 需求（按优先级）

1. P0：替换 MUI 为轻量方案（UI 简单，倾向手写）
2. P0：框架与依赖升级到现代版本
3. P0：重写标题锚点——现状 hash 是 sha256 前 16 位（`#H4f2a9c...`），应改为标题文本派生的可读 slug
4. P1：侧边栏与响应式布局体验优化
5. P0：引入 mermaid
6. P1：优化内存占用

### 已确认的关键决策

| 决策点 | 结论 |
|---|---|
| 渲染架构 | **保留 React SSR**（renderToString + 状态注水），仅去掉 emotion 换静态 CSS |
| UI 实现 | **手写 CSS + 手写组件**，零 UI 运行时依赖 |
| 升级范围 | 全面升级（Vite 7 / React 19 / TS 5.x / ESLint 9 / unified 11 系），**放弃旧浏览器**（删 plugin-legacy 与 .browserslistrc），**保留 mobx**，**express 升 v5** |
| 路由 | **react-router 升级到 v7 保留**（不自写路由） |
| mermaid | **客户端懒加载**（服务端渲染需 puppeteer，排除） |
| 执行节奏 | 两阶段：先换地基（依赖/构建/测试/CI），再换皮肤（UI 重写） |

## 一、总体架构

| 层 | 现状 | 目标 |
|---|---|---|
| 构建 | Vite 3（lock 半迁移至 4，未提交）+ plugin-legacy + postcss 链 + sass | Vite 7；删 legacy/postcss/sass，原生 CSS 嵌套 |
| UI | MUI 5 + emotion（SSR critical CSS 提取） | 手写组件 + CSS 自定义属性，零 UI 运行时依赖 |
| 框架 | React 18 / react-router 6.3 / TS 4.5 | React 19 / react-router 7 / TS 5.9 |
| 服务端 | express 4 / chokidar 3 / socket.io 4.5 | express 5 / chokidar 4 / socket.io latest |
| 渲染管线 | unified 10 系（remark-parse 10 等） | unified 11 系（remark-parse 11、rehype 13 系） |
| 测试 | jest + babel 链（实际仅 utils.test.ts 在跑；render.test.ts 被 testMatch 排除；CI 已坏） | vitest；e2e 移植 @playwright/test；重写 CI |
| Node | 未声明 | engines `>=20`（开发环境 22.14） |

工作区中未提交的 vite@4 pnpm-lock 改动将被 vite 7 依赖安装重新生成覆盖，不保留。

## 二、第一阶段：换地基（代码尽量少动）

- 依赖升级如上表；本阶段删除 `@vitejs/plugin-legacy`、`.browserslistrc`、`postcss-flexbugs-fixes`/`postcss-preset-env`/`postcss-normalize`、`sass`、`deepmerge`；`@mui/*` 与 `@emotion/*` 留待第二阶段随 UI 重写一起删除（一阶段 MUI 仍依赖 emotion）。
- ESLint 9 扁平配置（eslint.config.mjs）+ typescript-eslint 8（airbnb 配置与 eslint 9 不兼容，替换为 typescript-eslint recommended + import 插件）；stylelint 16。
- jest → vitest + @vitest/coverage-v8；`render.test.ts` 移植为 `@playwright/test` 冒烟测试。
- CI workflow 重写：ubuntu-latest + Node 22 + pnpm + vitest + playwright（chromium）。
- 验收：`make dev` / `make build` / `make test` 全绿，页面行为与现状一致。

## 三、第二阶段：UI 重写

### 组件（全部手写，约 8 个小组件）

Header（面包屑 + 主题开关）、Sidebar（文件列表 + TOC 树）、TocTree（递归列表 + 折叠）、Toast、Skeleton、Toggle、Icon（内联 SVG ×~8）。替代 MUI 的 Drawer/TreeView/Breadcrumbs/Snackbar/Switch/Skeleton/NoSsr 等。

### 布局与响应式

- 桌面（≥768px）：侧边栏常驻、可折叠为 0 宽（去掉现状 32px 碎条），内容区 margin 过渡；TOC 与文件列表共栏。
- 移动（<768px）：侧边栏为 overlay 抽屉（fixed + 遮罩 + 点击遮罩关闭），Header 汉堡按钮，内容区全宽。
- 断点 CSS media query，过渡 CSS transition。

### 主题机制

- `<html data-theme="dark|light">` + CSS 自定义属性控制应用 chrome。
- markdown 主体沿用 github-markdown-css 双主题 + hljs 双主题静态文件，切换 = 换 `<link href>` + 改 `data-theme` + 写 cookie。
- 初始主题由服务端读 cookie 直出，无闪烁。
- **删除 socket 协议中 `FetchStyle`/`PenStyle` 事件**（切换本地完成，不再走 socket 往返）；服务端 `theme.ts` 的 MUI ThemeOptions 合并逻辑全部删除。
- SSR 保留 renderToString + serialize-javascript 注水；删除 emotion critical CSS 提取，静态 CSS 直接进模板，`index.server.tsx` 变薄。

## 四、锚点与 TOC 重写

- 服务端 `rehypeTocId` 改用 `github-slugger`：中文保留原文（`#中文标题`），英文小写连字符（`#my-heading`），重复自动 `-1` 后缀；id 直接挂 `<h2 id="...">`，删除双 span 结构（现状：`<h2><span id="H..."/><span>文本</span></h2>`）。
- sticky header 遮挡：`h1..h6 { scroll-margin-top: <header高度> }` 替代 64px padding hack（顺带解决 footnote 滚动遮挡同类问题）。
- TOC 提取合并进渲染管线**单遍完成**（插件渲染时构建 `DocToc[]`），删除 `tocExtractor` 对渲染结果的第二次全量 parse。
- 客户端删除 `useDocToc` 手动 addEventListener；TOC 点击 = `history.pushState` 更新 hash + `scrollIntoView`；保留标题点击定位交互；新增 TOC 当前节点高亮（IntersectionObserver scrollspy）。

## 五、mermaid

- 服务端：`language-mermaid` 代码块跳过 hljs，输出 `<pre class="pen-mermaid">` + 源码（SSR 直出，无 JS 可读）。
- 客户端：内容更新后检测 `.pen-mermaid`，存在才 `import('mermaid')`（约 2MB，不进主包）；`mermaid.initialize({ theme: 跟随当前主题 })` 后逐块渲染替换为 SVG；失败显示错误块 + 保留源码；主题切换时重渲染。

## 六、内存与性能

- 去 MUI/emotion：客户端堆与包体积最大头。
- 服务端与客户端 LRU 由「按条数」改「按字节上限」（lru-cache `maxSize` + `sizeCalculation`）。
- hljs 高亮改用 `lowlight`：hast 原生输出，删除 parse5 字符串往返双重转换，连带删除 `parse5`/`hast-util-from-parse5` 依赖；语言集合维持现有 ~20 种显式注册。
- TOC 单遍提取（见四）。
- `clipboard` 库换原生 `navigator.clipboard`；`js-cookie` 换 ~15 行手写 helper。

## 七、兼容性影响

- CLI 参数与 README 用法不变；npm 包保持 CJS 服务端产物与 `pen` bin 不变（`get-port` 停留在 CJS 的 v6，避免服务端构建被迫 ESM 化）。
- socket 协议删除 `FetchStyle`/`PenStyle` 两个事件（客户端服务端同包发布，无兼容负担）。
- README 更新：锚点说明、mermaid 用法、移除「不做 mermaid」的 Q&A。

## 八、测试策略

- vitest 单测：utils（现有用例保留）、rehype 插件（slug/TOC 单遍提取、mermaid 标记、容器、复制按钮）、cookie helper。
- @playwright/test 冒烟：首页渲染、锚点点击定位、主题切换、mermaid 渲染、移动端抽屉。
- CI：单测 + chromium 冒烟。
