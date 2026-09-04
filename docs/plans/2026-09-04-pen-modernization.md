# Pen 现代化改造实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 按已确认的设计（见 `docs/plans/2026-09-04-pen-modernization-design.md`）完成两阶段改造：先升级整条工具链（Vite 8 / React 19 / express 5 / unified 11 / vitest / ESLint 10），再用零运行时依赖的手写 UI 替换 MUI，重写锚点/TOC、引入 mermaid、优化内存。

**Architecture:** 保留 React SSR（renderToString + serialize-javascript 注水），服务端构建产物从 CJS 改为 **ESM**（`.mjs`），所有依赖走 external——这是为了适配 vite 8 (Rolldown) 的 SSR 行为与 chokidar 5 / commander 15 / open 11 等 ESM-only 依赖。客户端 UI 全部手写（CSS 自定义属性 + 原生 CSS 嵌套），主题为 `<html data-theme>` + 静态 CSS 文件切换。

**Tech Stack:** Vite 8 (Rolldown)、React 19.2、react-router 8、TypeScript 5.9（**不能升 7**，typescript-eslint 上限 `<6.1`）、ESLint 10 + typescript-eslint 8、express 5、chokidar 5、socket.io 4.8、unified 11 系、mobx 7 + mobx-react-lite 5、vitest 5、@playwright/test 1.62、mermaid 11（懒加载）、lowlight 3、github-slugger 2、lru-cache 11。

**约定：**
- Node `>=20.19`（本机 22.14 ✓）。包管理器 pnpm 10。
- 每个任务完成后用 conventional commit 提交。若 husky 钩子因工具链半迁移状态失败，临时 `git commit --no-verify`，Task 5 完成后必须恢复。
- 工作区里未提交的 `pnpm-lock.yaml`（vite@4 半迁移）会在 Task 1 重新生成时被覆盖，**这是预期行为**，设计文档已记录。
- TDD 适用于：rehype 插件、cookie 工具、LRU 尺寸计算。UI 组件以 `make dev` 手动验证 + Playwright e2e 覆盖（设计文档第八节）。
- 命令均在仓库根目录执行。

---

## Phase 1 — 换地基（代码尽量少动，MUI 暂留）

### Task 1: 依赖大版本升级 + Vite 8 构建链迁移 + 服务端产物 ESM 化

**Files:**
- Modify: `package.json`（全量重写，内容见 Step 1）
- Delete: `pnpm-lock.yaml`（旧的，重新生成）、`.browserslistrc`、`babel.config.js`
- Modify: `config/vite.common.mts`、`config/vite.prod.mts`、`config/vite.server.mts`、`config/vite.serverEntry.mts`、`config/vite.dev.mts`
- Create: `cli.mjs`；Delete: `cli.js`
- Modify: `src/routes/index.ts`（globEager）、`src/server/index.ts`（`__dirname`）、`src/server/render.ts`（动态 import 路径）、`src/index.client.tsx`（scss→css import）、`src/assets/index.scss` → `src/assets/index.css`、`makefile`

**Step 1: 重写 package.json**

```json
{
  "version": "5.4.6",
  "name": "@everseen/pen",
  "author": "EverSeenTOTOTO",
  "keywords": "markdown,gfm",
  "homepage": "https://github.com/EverSeenTOTOTO/pen-middleware#readme",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/EverSeenTOTOTO/pen-middleware.git"
  },
  "main": "dist/index.mjs",
  "type": "commonjs",
  "bin": {
    "pen": "cli.mjs"
  },
  "engines": {
    "node": ">=20.19"
  },
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  },
  "config": {
    "commitizen": {
      "path": "./node_modules/cz-conventional-changelog"
    }
  },
  "dependencies": {
    "better-logging": "^5.0.0",
    "chokidar": "^5.0.0",
    "clsx": "^2.1.1",
    "commander": "^15.0.0",
    "cookie-parser": "^1.4.7",
    "express": "^5.2.1",
    "get-port": "^7.2.0",
    "github-slugger": "^2.0.0",
    "highlight.js": "^11.11.0",
    "katex": "^0.16.0",
    "lowlight": "^3.3.0",
    "lru-cache": "^11.5.2",
    "mobx": "^7.0.3",
    "mobx-react-lite": "^5.0.3",
    "open": "^11.0.2",
    "react": "^19.2.8",
    "react-dom": "^19.2.8",
    "react-router": "^8.3.1",
    "serialize-javascript": "^7.1.1",
    "socket.io": "^4.8.3",
    "socket.io-client": "^4.8.3"
  },
  "devDependencies": {
    "@commitlint/cli": "^19.6.0",
    "@commitlint/config-conventional": "^19.6.0",
    "@playwright/test": "^1.62.1",
    "@types/express": "^5.0.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^6.1.1",
    "@vitest/coverage-v8": "^5.0.0",
    "commitizen": "^4.3.1",
    "cz-conventional-changelog": "^3.3.0",
    "eslint": "^10.9.1",
    "github-markdown-css": "^5.8.0",
    "hast-util-to-string": "^3.0.1",
    "hastscript": "^9.0.1",
    "husky": "^9.1.7",
    "lint-staged": "^15.4.0",
    "mermaid": "^11.17.2",
    "react": "^19.2.8",
    "rehype-katex": "^7.0.1",
    "rehype-raw": "^7.0.0",
    "rehype-stringify": "^10.0.1",
    "remark-directive": "^3.0.0",
    "remark-gfm": "^4.0.1",
    "remark-math": "^6.0.0",
    "remark-parse": "^11.0.0",
    "remark-rehype": "^11.1.2",
    "stylelint": "^17.14.1",
    "stylelint-config-standard": "^39.0.0",
    "typescript": "~5.9.3",
    "typescript-eslint": "^8.69.0",
    "unified": "^11.0.5",
    "unist-util-visit": "^5.1.0",
    "vite": "^8.2.2",
    "vite-plugin-static-copy": "^3.0.0",
    "vitest": "^5.0.0"
  },
  "lint-staged": {
    "*.{js,ts,jsx,tsx,mjs,mts}": "eslint --cache --fix",
    "*.css": "stylelint --fix"
  }
}
```

注意：
- **暂留** `@mui/*`、`@emotion/*`、`clipboard`、`js-cookie`、`parse5`、`react-router-dom` 等 Phase 2 才删的包——**先别删**，把上面列表 merge 进现有 package.json，保留旧依赖，Phase 2 Task 11 清理。原因：MUI 5 与 React 19 peer 不匹配只会警告（pnpm 默认不严格），Phase 2 马上删除；若构建期 MUI+React19 实际报错， contingency：临时升 `@mui/material@^7` 等（支持 React 19），反正 Phase 2 会删除。
- `@types/js-cookie`、`@types/serialize-javascript`：若 `pnpm install` 报缺失类型再补；serialize-javascript v7 自带类型。
- react 重复出现在 deps/devDeps 无害（去重）；实际写文件时 devDeps 里不要重复 react。
- 版本号以 `npm view <pkg> version` 为准微调（写计划时 2026-09 查询）；`stylelint-config-standard`、`github-markdown-css`、`lint-staged`、`@commitlint/*`、`vite-plugin-static-copy` 安装时取 latest。

**Step 2: 删除旧 lock 并安装**

```bash
rm pnpm-lock.yaml && pnpm install
```

预期：大量 peer warning（MUI×React19）可忽略；若有 hard error 按提示处理（不允许 `--force` 盲装）。

**Step 3: Vite 配置迁移（vite 3→8 + ESM 服务端产物）**

`config/vite.common.mts`——删除 postcss 插件链与 sass，其余保留：

```ts
import path from 'path';
import react from '@vitejs/plugin-react';

export const paths = {
  src: path.resolve(import.meta.dirname, '..', 'src'),
  dist: path.resolve(import.meta.dirname, '..', 'dist'),
  template: path.resolve(import.meta.dirname, '..', 'index.html'),
  server: path.resolve(import.meta.dirname, '..', 'src/server/index.ts'),
  serverEntry: path.resolve(import.meta.dirname, '..', 'src/index.server.tsx'),
};

export default ({ mode }) => ({
  plugins: [react()],
  build: {
    sourcemap: mode === 'development',
    emptyOutDir: false,
  },
  resolve: {
    alias: { '@': paths.src },
  },
  css: { devSourcemap: mode === 'development' },
});
```

`config/vite.server.mts`——输出 ESM、不再 external ESM-only 依赖（全部 external 即可，ESM 输出下 import CJS/ESM 都合法）：

```ts
import { defineConfig } from 'vite';
import { paths } from './vite.common.mts';

export default defineConfig(({ mode }) => ({
  build: {
    ssr: true,
    sourcemap: mode === 'development',
    emptyOutDir: true,
    rollupOptions: {
      input: paths.server,
      output: {
        format: 'esm',
        entryFileNames: 'index.mjs',
      },
    },
  },
  resolve: {
    alias: {
      '@': paths.src,
      'node:net': 'net',
      'node:os': 'os',
    },
  },
}));
```

注意：vite 8 底层是 Rolldown。若 `format: 'esm'` 或 `entryFileNames` 报错/不生效，查 Rolldown 兼容层的等价配置（`build.rollupOptions` 兼容别名保留；`esm` 格式可能叫 `'esm'` 或 `'module'`，以构建产物 `dist/index.mjs` 含 `import`/`export` 语句为准）。**验收标准是产物，不是配置写法。**

`config/vite.serverEntry.mts`：

```ts
import { defineConfig } from 'vite';
import base, { paths } from './vite.common.mts';

export default defineConfig((c) => ({
  ...base(c),
  build: {
    ...base(c).build,
    ssr: paths.serverEntry,
    rollupOptions: {
      output: {
        format: 'esm',
        entryFileNames: 'index.server.mjs',
      },
    },
  },
}));
```

（若 deepmerge 展开行为有差异，直接展开覆盖即可——本文件原来是 deepmerge(base, {...})。）

`config/vite.prod.mts` / `config/vite.dev.mts`：把 `deepmerge(base(c), {...})` 换成 `{ ...base(c), ... }` 展开（deepmerge 已删）。dev 配置里 `root: path.join(process.cwd(), '../..')` 等逻辑保留。

**Step 4: 源码适配**

- `src/routes/index.ts`：`import.meta.globEager` 在 vite 5+ 已删除，改为：
  ```ts
  const pages = import.meta.glob('../pages/*.tsx', { eager: true });
  ```
- `src/server/index.ts` `normalizeOptions`：`path.join(__dirname)` → `import.meta.dirname`（Node 20.11+；ESM 产物里 `__dirname` 不存在）。默认 `dist` 路径产物现在是 `dist/index.mjs`，`dist` 目录值不变。
- `src/server/render.ts`：`import(path.join(options.dist, 'index.server.js'))` → `'index.server.mjs'`。
- `src/assets/index.scss` → 重命名为 `src/assets/index.css`：把 SCSS 嵌套语法转换为**原生 CSS 嵌套**（现代浏览器与 Vite 8 直接支持，`&` 选择器语法一致，仅删除 `$` 变量——本文件没有变量）。`src/index.client.tsx` 的 import 路径同步改。
- `src/server/plugins/rehype-highlight.ts`：`__dirname` 拼 node_modules 路径 + `require()` 在 ESM 产物会挂——**本任务先最小修复**：直接顶部静态 import 所需语言（保持现语言清单），`loadLanguage` 动态部分删除。Task 10 会用 lowlight 重写此文件，此处只需 build 过：
  ```ts
  import hljs from 'highlight.js/lib/core';
  import xml from 'highlight.js/lib/languages/xml';
  import bash from 'highlight.js/lib/languages/bash';
  // ... 其余同清单静态 import，一次性 hljs.registerLanguage(...)
  ```
  `parse5` 双重转换逻辑暂留（Task 10 删）。
- `src/utils.ts`：`perf` 里 `process.env.NODE_ENV` 判断保留；无 `__dirname`。
- `env.d.ts`：删除 `declare module 'get-port'/'better-logging'/'cookie-parser'`（包自带类型）与 `/// <reference types="vue/macros-global" />`（vue 残留）；`globEager` 声明删除。

**Step 5: cli.js → cli.mjs**

```js
#!/usr/bin/env node
import { createRequire } from 'module';
import { program } from 'commander';
import open from 'open';
import { createServer } from './dist/index.mjs';

const require = createRequire(import.meta.url);
const { version } = require('./package.json');

program
  .version(version)
  .option('-r, --root <root>', 'set watching directory, relative path to current dir, default `.`')
  .option('-n, --namespace <namespace>', 'set socket.io namespace, default `/`')
  .option('-p, --port <port>', 'set server port, default `3000` or another auto-detected avaliable port')
  .option('-i, --ignores <ignores...>', 'set ignoring files, default `[]`, for example if you want to ignore dotfiles: `-i "^\\."`')
  .option('-s, --silent', 'ignore logger messages, default `false`')
  .option('-o, --open', 'open browser automatically, default `false`')
  .option('-S, --socketPath <socketPath>', 'Set socket.io path, default `/pensocket.io`')
  .parse();

const opts = program.opts();

createServer(opts)
  .then(({ port, options }) => {
    options.logger.done(`Pen server listening on ${port}`);
    if (opts.open) {
      open(`http://localhost:${port}${options.namespace}`);
    }
  })
  .catch((e) => console.error(e.stack || e.message));
```

注意 `process.env.NODE_ENV = 'production'` 设置去掉（vite 产物不再依赖；如 SSR 产物有 `process.env.NODE_ENV` 引用，在 cli.mjs 顶部保留 `process.env.NODE_ENV ||= 'production'`）。

**Step 6: makefile 更新**

- `build\:server` 两条 vite build 命令不变（配置文件内已改输出名）。
- 删除 lint 目标里的 `npx tsc` 注释行可留。
- `test` 目标本任务先不指向 vitest（Task 4 做），临时保留 jest 命令没关系（本任务不跑它）。
- `prepare` 目标不变（github-markdown/hljs/katex css 拷贝名不变）。

**Step 7: 构建验证**

```bash
make prepare && make build && node -e "import('./dist/index.mjs').then(m => console.log(Object.keys(m)))"
```

预期：三个 vite build 全部成功；`dist/index.mjs` 与 `dist/index.server.mjs` 存在且为 ESM；动态 import 不抛错。

随后 `make dev` 手动验证（另开终端 `node cli.mjs -o -p 3100 -r <任意md目录>`）：页面可打开、热更新可用。MUI 组件在 React 19 下渲染正常（如有运行时报错，用 contingency 升 MUI@7）。

**Step 8: Commit**

```bash
git add -A && git commit -m "build: migrate toolchain to vite 8 / react 19 / express 5, ship ESM server bundle"
```

---

### Task 2: TypeScript 5.9 与 tsconfig 现代化

**Files:** Modify `tsconfig.json`、`tsconfig.eslint.json`；Modify 被新 TS 报错的源文件。

**Step 1:** `tsconfig.json` 更新：

```json
{
  "compilerOptions": {
    "target": "es2022",
    "module": "esnext",
    "moduleResolution": "bundler",
    "lib": ["es2022", "dom", "dom.iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "useDefineForClassFields": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src", "tests", "config", "cli.mjs"]
}
```

（删除 `experimentalDecorators`/`emitDecoratorMetadata`/`declaration*`——mobx 6 observable 不需要装饰器。）

**Step 2:** `npx tsc -p . --noEmit` 修复所有报错。预期集中在：`verbatimModuleSyntax` 触发的 type-only import（`import type { ... }`）、`@types/react` 19 的 JSX 类型变化、`AlertColor` 等 MUI 类型（保持可用，别删）。逐个修，不改行为。

**Step 3:** `tsconfig.eslint.json` 若只被旧 eslint 用，内容改为引用同一套 include（Task 3 决定去留）。

**Step 4:** `make build` 仍绿。Commit：

```bash
git add -A && git commit -m "chore: bump typescript to 5.9 with bundler resolution"
```

---

### Task 3: react-router v8 迁移

**Files:** Modify `src/App.tsx`、`src/index.client.tsx`、`src/index.server.tsx`、`src/store/hooks.ts`、`src/pages/**` 中所有 `react-router` / `react-router-dom` import；`package.json`（删 `react-router-dom`）。

**Step 1:** 先验证 v8 的导出位置：

```bash
node -e "import('react-router').then(m => console.log(['StaticRouter','BrowserRouter','Routes','Route','useLocation','useNavigate','Link'].map(k => k + ':' + (k in m))))"
```

预期全部 `true`（v8 把所有导出合并进 `react-router`）。若 `StaticRouter` 不在主入口，查 `react-router` 的 server 子导出（`react-router/server`），以实际为准。

**Step 2:** 全局替换 import 来源：`react-router` 与 `react-router-dom` → `react-router`。特别注意 `src/index.server.tsx` 的 `import { StaticRouter } from 'react-router-dom/server.js'` → `import { StaticRouter } from 'react-router'`（或 Step 1 验证出的路径）。

**Step 3:** `pnpm remove react-router-dom && make build && make dev` 验证导航/SSR 正常。Commit：

```bash
git add -A && git commit -m "refactor: migrate to react-router v8 unified package"
```

---

### Task 4: ESLint 10 扁平配置 + stylelint 17

**Files:** Create `eslint.config.mjs`、`stylelint.config.mjs`；Delete `.eslintrc.js`、`.eslintignore`、`.stylelintrc.json`、`tsconfig.eslint.json`。

**Step 1:** `eslint.config.mjs`：

```js
// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules', 'src/assets', 'playwright-report', 'test-results'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
    },
  },
);
```

需要补装 `@eslint/js`（pnpm add -D）。`.eslintignore` 的内容并进上面的 `ignores`。

**Step 2:** `stylelint.config.mjs`：

```js
export default {
  extends: ['stylelint-config-standard'],
  rules: {
    'custom-property-pattern': null,
    'class-name-pattern': null,
  },
};
```

（SCSS 相关配置与插件已随 sass 删除。）

**Step 3:** `pnpm remove stylelint-config-idiomatic-order stylelint-config-standard-scss stylelint-order stylelint-scss eslint-config-airbnb-typescript eslint-import-resolver-typescript eslint-plugin-import eslint-plugin-jest @typescript-eslint/eslint-plugin @typescript-eslint/parser`（保留 `typescript-eslint`）。

**Step 4:** 验证并修复：

```bash
npx eslint . ; npx stylelint "src/**/*.css"
```

预期：大量历史 lint 报错，按新规则**机械修复**（多为 unused vars、`any` 显式化），不改运行行为。修复量若过大可对 `src/**` 逐目录进行，但不要加 `eslint-disable` 大面积压制。

**Step 5:** `make lint` 目标更新为新命令（去掉 tsc 注释行可留），`.husky/pre-commit` 不变（lint-staged 已在 package.json 更新为 `*.mjs/mts` 匹配）。Commit：

```bash
git add -A && git commit -m "chore: migrate to eslint 10 flat config and stylelint 17"
```

---

### Task 5: jest → vitest

**Files:** Create `vitest.config.mts`；Modify `tests/utils.test.ts`（如需）；Delete `jest.config.js`、`tests/render.test.ts`（被 Task 7 的 playwright 版替代）；Modify `makefile`、`package.json`。

**Step 1:** `pnpm remove jest babel-jest @babel/core @babel/preset-env @babel/preset-typescript @types/jest`。

**Step 2:** `vitest.config.mts`：

```ts
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
```

**Step 3:** `pnpm test` 跑 `tests/utils.test.ts`，应直接通过（describe/it/expect 全兼容）。`tests/setup.ts` 里 playwright/jest 无关的导出（mockRemark、temp 目录夹具）保留——Task 7 会用。

**Step 4:** makefile：`test:` 目标改为 `npx vitest run --coverage`；新增 `test\:e2e:` 目标 `npx playwright test`。CI 两个都跑（Task 6）。

**Step 5:** Commit：

```bash
git add -A && git commit -m "test: replace jest with vitest"
```

---

### Task 6: CI workflow 重写 + engines

**Files:** Rewrite `.github/workflows/ci.yml`；Modify `package.json`（engines 已在 Task 1 加，确认即可）。

**Step 1:** 新 ci.yml：

```yaml
name: CI
on:
  push:
    branches: [main, ci]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: make prepare
      - run: make build
      - run: npx playwright install --with-deps chromium
      - run: pnpm test
      - run: pnpm test:e2e
```

（若仓库无 pnpm store 缓存配置报错，去掉 `cache: pnpm`。）

**Step 2:** Commit：

```bash
git add -A && git commit -m "ci: rewrite workflow for pnpm/vitest/playwright on node 22"
```

---

### Task 7: Playwright e2e 基础冒烟

**Files:** Create `playwright.config.ts`、`tests/e2e/home.spec.ts`、`tests/fixtures/`（夹具文档）。

**Step 1:** `playwright.config.ts`：

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30000,
  use: { baseURL: 'http://localhost:3210' },
  webServer: {
    command: 'node cli.mjs -s -p 3210 -r tests/fixtures',
    url: 'http://localhost:3210',
    reuseExistingServer: !process.env.CI,
  },
});
```

**Step 2:** `tests/fixtures/`：创建 `README.md`（含 `# Title`、二级/三级标题、重复标题、中文标题、一个 ```mermaid 代码块、一个 ```js 代码块、容器指令 `:::info`）。这些夹具同时服务 Task 12/14 的 e2e。

**Step 3:** 基础冒烟（先只写当前行为可过的断言；锚点/mermaid 断言在 Task 14 扩充）：

```ts
import { test, expect } from '@playwright/test';

test('renders markdown readme', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.markdown-body h1')).toContainText('Title');
});

test('sidebar lists directory entries', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('a[href]')).toContainText(['README']); // 按实际夹具调整
});
```

**Step 4:** `pnpm test:e2e` 本地通过（需先 `make build`）。Commit：

```bash
git add -A && git commit -m "test: add playwright e2e smoke suite"
```

---

## Phase 2 — 换皮肤（去 MUI、新锚点、mermaid、内存）

### Task 8: 服务端锚点/TOC 重写（github-slugger 单遍提取 + mermaid 标记）

**Files:** Rewrite `src/server/plugins/rehype-toc.ts`；Modify `src/server/plugins/rehype-highlight.ts`（仅 mermaid 分支）、`src/server/rehype.ts`；Create `tests/rehype-toc.test.ts`；Modify `src/types.ts`（DocToc 去掉 parent 注释即可）。

**Step 1: 写失败测试** `tests/rehype-toc.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { h } from 'hastscript';
import { VFile } from 'vfile';
import { rehypeSlugToc } from '@/server/plugins/rehype-toc';

const run = (tree: ReturnType<typeof h>) => {
  const file = new VFile();
  rehypeSlugToc()(tree, file);
  return { tree, toc: file.data.toc };
};

describe('rehypeSlugToc', () => {
  it('slugs headings and collects toc in document order', () => {
    const { tree, toc } = run(h('div', [
      h('h1', 'Hello World'),
      h('h2', '中文标题'),
      h('h3', 'Nested'),
    ]));
    expect(tree.children[0].properties.id).toBe('hello-world');
    expect(tree.children[1].properties.id).toBe('中文标题');
    expect(toc).toEqual([
      { id: 'hello-world', text: 'Hello World', heading: 1, children: [
        { id: '中文标题', text: '中文标题', heading: 2, children: [
          { id: 'nested', text: 'Nested', heading: 3, children: [] },
        ] },
      ] },
    ]);
  });

  it('deduplicates repeated headings github-style', () => {
    const { tree } = run(h('div', [h('h2', 'Same'), h('h2', 'Same')]));
    expect(tree.children[0].properties.id).toBe('same');
    expect(tree.children[1].properties.id).toBe('same-1');
  });

  it('handles sibling heading level jumps', () => {
    const { toc } = run(h('div', [h('h1', 'A'), h('h3', 'B'), h('h2', 'C')]));
    expect(toc[0].children.map((c: any) => c.text)).toEqual(['B', 'C']);
  });

  it('resets slug uniqueness per run', () => {
    const a = run(h('h2', 'Dup'));
    const b = run(h('h2', 'Dup'));
    expect(b.tree.children[0].properties.id).toBe('dup');
  });
});
```

（vfile 是 unified 的依赖，`pnpm add -D vfile` 若未传递暴露。）

**Step 2:** `npx vitest run tests/rehype-toc.test.ts` → FAIL（模块不存在）。

**Step 3: 实现** `src/server/plugins/rehype-toc.ts` 全量重写：

```ts
import GithubSlugger from 'github-slugger';
import { visit } from 'unist-util-visit';
import { toString } from 'hast-util-to-string';
import type { Root, Element } from 'hast';
import type { VFile } from 'vfile';
import { DocToc } from '@/types';

const HEADING_REGEXP = /^h([1-6])$/;

export const PEN_TOC_DATA = 'penToc';

/**
 * Single pass: slug every heading (github-slugger rules, CJK preserved),
 * set the id on the heading element itself and collect the toc tree into
 * file.data.penToc — replacing the old two-span hack and the second
 * full re-parse of the rendered HTML.
 */
export function rehypeSlugToc() {
  return (tree: Root, file: VFile) => {
    const slugger = new GithubSlugger(); // per file: resets uniqueness
    const root: DocToc = { id: '', text: '', heading: 0, children: [] };
    const stack: DocToc[] = [root];

    visit(tree, 'element', (node: Element) => {
      const match = typeof node.tagName === 'string' ? node.tagName.match(HEADING_REGEXP) : null;
      if (!match) return;

      const heading = Number(match[1]);
      const text = toString(node);
      const id = slugger.slug(text);

      node.properties.id = id;

      while (stack.length > 1 && heading <= stack[stack.length - 1].heading) {
        stack.pop();
      }

      const item: DocToc = { id, text, heading, children: [] };
      stack[stack.length - 1].children.push(item);
      stack.push(item);
    });

    file.data[PEN_TOC_DATA] = root.children;
  };
}
```

注意：`hast` 类型来自 hast-util-to-string 的传递依赖，必要时 `pnpm add -D @types/hast`。

**Step 4:** 测试通过后接线 `src/server/rehype.ts`：

- 删除 `tocExtractor` 处理器（`unified().use(rehypeParse).use(rehypeToc)`）与 `rehype-parse`、`rehype-dom-stringify` 依赖（`pnpm remove rehype-parse rehype-dom-stringify`，后者本来就没被引用）。
- defaultPlugins 里 `['rehype-toc-id', rehypeTocId]` → `['rehype-slug-toc', rehypeSlugToc]`。
- `process()` 改为：

```ts
async process(markdown: string): Promise<{ content: string, toc?: DocToc[] }> {
  try {
    perf?.mark('process content');
    const file = await this.render.process(markdown);
    const content = file.toString();
    const toc = file.data[PEN_TOC_DATA] as DocToc[] | undefined;
    perf?.measure('process content done', 'process content');
    return { content: encodeURIComponent(content), toc };
  } catch (reason) {
    return { content: `Remark/Rehype Error: ${String(reason)}` };
  }
}
```

（TOC text 不再单独 encodeURIComponent——见 Task 9 客户端同步删除 decode。）

**Step 5: mermaid 标记**——`src/server/plugins/rehype-highlight.ts` 的回调开头加：

```ts
if (language === 'mermaid') {
  code.properties.className = ['pen-mermaid-source'];
  return; // highlight.js 不处理，保留源码给客户端渲染
}
```

（`code-block.ts` 的回调签名是 `(lang, code, pre, idx, parent)`，第二个参数是 code 节点 ✓。）

**Step 6:** `npx vitest run && make build` 全绿。**注意**：此时客户端还依赖旧的双 span 结构（`useDocToc`、Toc 的 decode、css 的 `span[id^=H]` padding），页面点击定位会失效——属预期中间态，Task 9 修复。Commit：

```bash
git add -A && git commit -m "feat: github-style heading slugs with single-pass toc extraction, mark mermaid blocks"
```

---

### Task 9: 客户端锚点/TOC 接入

**Files:** Modify `src/pages/components/Toc.tsx`、`src/store/hooks.ts`（删 `useDocToc`，加 `useScrollSpy`）、`src/store/modules/drawer.ts`（activeToc）、`src/assets/index.css`。

**Step 1:** `Toc.tsx` 临时小改（Task 11 重写组件前的过渡——也可以在本任务直接删掉 MUI TreeView 换成 Task 11 的 TocTree；**推荐顺序调整**：本任务只做数据层，组件层留给 Task 11，避免两次重写）：

- 删除 `decodeURIComponent(toc.text)`（text 已是原文）。
- drawer store 增加 `activeToc = ''` 与 `setActiveToc(id)`。

**Step 2:** `src/store/hooks.ts`：删除 `useDocToc`；新增：

```ts
export const scrollToHeading = (id: string) => {
  document.getElementById(id)?.scrollIntoView();
  history.replaceState(null, '', `#${id}`);
};

export const useScrollSpy = () => {
  const home = useStore('home');
  const drawer = useStore('drawer');

  useEffect(() => {
    const headers = Array.from(document.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]'));
    if (!headers.length) return;

    const byId = new Map(headers.map((h) => [h.id, h]));
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible) drawer.setActiveToc(visible.target.id);
    }, { rootMargin: '-64px 0px -70% 0px' });

    headers.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [home.html]);
};
```

**Step 3:** `index.css`：删除旧的锚点 hack：

```css
/* 删除 */
h1, h2, h3, h4, h5, h6 { & > span:last-child { cursor: pointer; } & > span[id^="H"] { padding-top: 64px; } }
```

替换为：

```css
h1, h2, h3, h4, h5, h6 { scroll-margin-top: 64px; }
```

**Step 4:** `make dev` 手动验证：TOC 显示中文/英文 slug 无乱码；`useScrollSpy` 在 Home 挂接（Task 11 组件接线时正式调用，本任务可先挂在现有 Markdown 组件里）。Commit：

```bash
git add -A && git commit -m "feat: client anchor navigation with scrollspy"
```

---

### Task 10: 主题机制重写（data-theme + 静态 CSS 切换，删 socket 样式事件）

**Files:** Create `src/cookie.ts`、`tests/cookie.test.ts`；Rewrite `src/server/theme.ts`、`src/store/modules/theme.ts`；Modify `src/types.ts`、`src/server/socket.ts`、`src/store/modules/socket.ts`、`src/server/render.ts`、`config/vite.dev.mts`、`index.html`、`src/store/modules/cookie.ts`、`makefile`；Delete `src/assets/theme.dark.css`、`src/assets/theme.light.css`。

**Step 1: TDD cookie 工具** `tests/cookie.test.ts`：

```ts
import { describe, it, expect } from 'vitest';
import { parseCookies, serializeCookie } from '@/cookie';

describe('cookie helpers', () => {
  it('parses a cookie string', () => {
    expect(parseCookies('a=1; themeMode=%22dark%22')).toEqual({ a: '1', themeMode: '"dark"' });
  });
  it('serializes with max-age', () => {
    expect(serializeCookie('k', 'v', 1)).toBe('k=v; max-age=86400; path=/; samesite=lax');
  });
  it('serializes uri-encoded json', () => {
    expect(serializeCookie('themeMode', JSON.stringify('dark'), 365)).toContain('themeMode=%22dark%22');
  });
});
```

实现 `src/cookie.ts`（纯函数 + DOM 薄封装，与 js-cookie 值格式兼容——JSON 字符串，服务端 `JSON.parse(req.cookies.x)` 不变）：

```ts
export const parseCookies = (cookieString: string): Record<string, string> =>
  Object.fromEntries(
    cookieString
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const eq = part.indexOf('=');
        return eq === -1 ? [part, ''] : [part.slice(0, eq), decodeURIComponent(part.slice(eq + 1))];
      }),
  );

export const serializeCookie = (key: string, value: string, days = 365) =>
  `${key}=${encodeURIComponent(value)}; max-age=${days * 86400}; path=/; samesite=lax`;

export const getCookie = (key: string): string | undefined => parseCookies(document.cookie)[key];

export const getCookieJson = <T>(key: string): T | undefined => {
  const raw = getCookie(key);
  if (raw === undefined) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
};

export const setCookieJson = (key: string, value: unknown, days = 365) => {
  document.cookie = serializeCookie(key, JSON.stringify(value), days);
};
```

**Step 2: 服务端 theme.ts 重写**（删 MUI ThemeOptions/deepmerge）：

```ts
import path from 'path';
import fs from 'fs';
import { PenTheme, ThemeNames } from '../types';

const readNothrow = (dist: string, file: string) =>
  fs.promises.readFile(path.join(dist, file), 'utf8').catch(() => '');

export const THEMES: ThemeNames[] = ['dark', 'light'];

export const isThemeName = (v: unknown): v is ThemeNames =>
  typeof v === 'string' && THEMES.includes(v as ThemeNames);

/** theme-specific <link> tags injected into the SSR template */
export const themeLinks = (name: ThemeNames): string => [
  `<link id="pen-markdown-css" rel="stylesheet" href="/assets/github-markdown-${name}.css">`,
  `<link id="pen-hljs-css" rel="stylesheet" href="/assets/highlightjs-github-${name}.css">`,
].join('\n');

export const createTheme = async (name: ThemeNames, dist?: string): Promise<PenTheme> => {
  const css = dist ? await readNothrow(dist, `assets/pen-app-${name}.css`) : '';
  return { name, css, links: themeLinks(name), avaliable: THEMES };
};
```

（`pen-app-{dark,light}.css` 为应用 chrome 的变量文件——内容在 Task 11 的 base.css 任务里生成拷贝；若 Task 11 决定变量全部收进单一 base.css 并用 `data-theme` 区分，则 `css` 恒为空串，`createTheme` 简化为返回 links 即可。以此处宽松实现为准，Task 11 收敛。）

`types.ts` 中 `PenTheme` 改为：

```ts
export type ThemeNames = 'dark' | 'light';
export type PenTheme = {
  name: ThemeNames;
  css: string; // app chrome css for this theme (may be '')
  links: string; // <link> tags for markdown/hljs theme css
  avaliable: string[];
};
```

**Step 3: 删 socket 样式事件**：
- `types.ts`：删 `ClientEvents.FetchStyle`、`ServerEvents.PenStyle` 及对应事件签名。
- `src/server/socket.ts`：删 `setupThemeProvider` 与调用。
- `src/store/modules/socket.ts`：删 `PenStyle` 监听与 `onStyle`。

**Step 4: render.ts 注入**：
- 删 `createTheme` 的 css `<style id>` 注入路径，改为：template 替换新增占位符。`index.html` 的 `<head>` 里加 `<!--pen-theme-links-->`；`<html lang="en">` 改成 `<html lang="en">`（保留原样，render 时替换为 `<html lang="en" data-theme="dark">`）。
- `render.ts`：

```ts
const html = ctx.template
  .replace('<html', `<html data-theme="${theme.name}"`) // first <html> tag only
  .replace(APP_HTML, appHtml)
  .replace('<!--pen-theme-links-->', theme.links)
  .replace(APP_STATE, serialize(state));
```

- prefetch 里 theme 数据改为 `createTheme(themeMode)` 的精简结果（mode + links），`theme.css` 大字符串不再进 SSR state（省内存 + 省传输）。
- `config/vite.dev.mts` 的 devSSR middleware 同样处理模板占位符（复用同一 replace 逻辑，抽个小函数 `applyTemplate(template, theme, appHtml, stateScript)` 放 `src/server/render.ts` 导出，dev 配置 import 它）。

**Step 5: ThemeStore 重写**：

```ts
import { makeAutoObservable } from 'mobx';
import { ThemeNames } from '@/types';
import { setCookieJson } from '@/cookie';
import type { AppStore, PrefetchStore } from '..';

export type ThemeState = { mode: ThemeNames };

export class ThemeStore implements PrefetchStore<ThemeState> {
  mode: ThemeNames = 'dark';

  root: AppStore;

  constructor(root: AppStore) {
    makeAutoObservable(this);
    this.root = root;
  }

  changeTheme(mode: ThemeNames) {
    this.mode = mode;
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = mode;
      document.getElementById('pen-markdown-css')
        ?.setAttribute('href', `/assets/github-markdown-${mode}.css`);
      document.getElementById('pen-hljs-css')
        ?.setAttribute('href', `/assets/highlightjs-github-${mode}.css`);
    }
  }

  hydrate(state: ThemeState) {
    if (state?.mode) this.changeTheme(state.mode);
  }

  dehydra(): ThemeState {
    return { mode: this.mode };
  }
}
```

`src/store/modules/cookie.ts`：js-cookie 换 `setCookieJson`（drawerVisible 键名不变，服务端 render.ts 读 cookie 逻辑不变）。`pnpm remove js-cookie @types/js-cookie`。

**Step 6:** makefile `prepare`：删除 theme.dark/light.css 拷贝行（这俩文件删除；若 Task 11 需要 `pen-app-*.css` 再加行）。

**Step 7:** `npx vitest run && make build && make dev` 验证：切换主题 cookie 写入、刷新后主题保持、无 socket 报错。Commit：

```bash
git add -A && git commit -m "refactor: data-theme attribute with static css swap, drop socket style events"
```

---

### Task 11: 手写 UI——基础设施 + 小组件

**Files:** Create `src/assets/base.css`、`src/pages/components/Icon.tsx`、`Toast.tsx`、`Skeleton.tsx`、`Toggle.tsx`；Modify `src/store/modules/ui.ts`（notify 计时器、去 MUI 类型）、`src/index.client.tsx`（import base.css）。

**Step 1: Icon（feather 风格内联 SVG，MIT）**

```tsx
import type { CSSProperties } from 'react';

const ICONS = {
  folder: <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />,
  file: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </>
  ),
  chevronLeft: <path d="M15 18l-6-6 6-6" />,
  chevronRight: <path d="M9 18l6-6-6-6" />,
  chevronDown: <path d="M6 9l6 6 6-6" />,
  home: (
    <>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </>
  ),
  menu: (
    <>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </>
  ),
  arrowUp: (
    <>
      <line x1="12" y1="19" x2="12" y2="5" />
      <path d="M5 12l7-7 7 7" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </>
  ),
  moon: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />,
} as const;

export type IconName = keyof typeof ICONS;

const Icon = ({
  name, size = 18, className, style,
}: { name: IconName; size?: number; className?: string; style?: CSSProperties }) => (
  <svg
    className={className}
    style={style}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {ICONS[name]}
  </svg>
);

export default Icon;
```

**Step 2: UiStore 去 MUI 类型 + 自动消失**

```ts
export type Severity = 'success' | 'error' | 'info' | 'warning';

export class UiStore {
  root: AppStore;
  severity: Severity = 'info';
  message = '';
  private timer?: ReturnType<typeof setTimeout>;

  constructor(root: AppStore) {
    makeAutoObservable(this);
    this.root = root;
  }

  notify(severity: Severity, message: string) {
    this.severity = severity;
    this.message = message;
    if (this.timer) clearTimeout(this.timer);
    if (message) {
      this.timer = setTimeout(() => { this.message = ''; }, 3000);
    }
  }
  // breadcrumb getter 保持不变
}
```

（`makeAutoObservable` 会处理 timer 字段——声明为 private 并加 `makeAutoObservable<this, 'timer'>(this)` 或干脆 `timer?: ...` 非 private，以 lint 通过为准。）

**Step 3: Toast / Skeleton / Toggle**

```tsx
// Toast.tsx
import { observer } from 'mobx-react-lite';
import { useStore } from '@/store';

const Toast = observer(() => {
  const ui = useStore('ui');
  return (
    <div
      className={`toast ${ui.message ? 'toast-visible' : ''} toast-${ui.severity}`}
      role="status"
      aria-live="polite"
    >
      {ui.message}
    </div>
  );
});

export default Toast;
```

```tsx
// Skeleton.tsx
const Skeleton = () => (
  <div className="markdown-paper" aria-busy="true">
    <div className="skeleton skeleton-title" />
    <div className="skeleton" />
    <div className="skeleton" />
    <div className="skeleton skeleton-short" />
    <div className="skeleton" />
  </div>
);

export default Skeleton;
```

```tsx
// Toggle.tsx
import { observer } from 'mobx-react-lite';
import { useStore } from '@/store';
import Icon from './Icon';

const ThemeToggle = observer(() => {
  const theme = useStore('theme');
  const dark = theme.mode === 'dark';
  return (
    <button
      type="button"
      className="icon-btn"
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={() => theme.changeTheme(dark ? 'light' : 'dark')}
    >
      <Icon name={dark ? 'sun' : 'moon'} />
    </button>
  );
});

export default ThemeToggle;
```

**Step 4: base.css**（变量 + 布局 + 组件样式，原生嵌套；`index.css` 保留 markdown 内容相关规则，应用 chrome 全部搬到这里）

```css
/* ---- tokens ---- */
:root {
  --pen-header-height: 48px;
  --pen-sidebar-width: 280px;
  --pen-bg: #fff;
  --pen-fg: rgba(0 0 0 / 80%);
  --pen-fg-muted: rgba(0 0 0 / 50%);
  --pen-border: rgba(0 0 0 / 12%);
  --pen-accent: #0969da;
  --pen-paper: #fff;
  --pen-backdrop: rgba(0 0 0 / 40%);
}
:root[data-theme='dark'] {
  --pen-bg: #0d1117;
  --pen-fg: rgba(255 255 255 / 80%);
  --pen-fg-muted: rgba(255 255 255 / 50%);
  --pen-border: rgba(255 255 255 / 15%);
  --pen-accent: #58a6ff;
  --pen-paper: #0d1117;
}

/* ---- shell ---- */
html, body { height: 100%; }
body {
  margin: 0;
  background: var(--pen-bg);
  color: var(--pen-fg);
  font-size: 16px;
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  transition: background-color 0.2s, color 0.2s;
}
* { box-sizing: border-box; }
*::before, *::after { box-sizing: border-box; margin: 0; }

.app { min-height: 100dvh; }
.app-main {
  margin-left: 0;
  padding: 0 16px;
  transition: margin-left 0.25s ease;
}
.app-sidebar-open .app-main { margin-left: var(--pen-sidebar-width); }

/* ---- header ---- */
.app-header {
  position: sticky;
  top: 0;
  z-index: 10;
  height: var(--pen-header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  background: var(--pen-bg);
  border-bottom: 1px solid var(--pen-border);
  padding: 0 12px;
}
.app-header .icon-btn { display: none; } /* hamburger, mobile only */

/* ---- breadcrumbs ---- */
.breadcrumb { display: flex; align-items: center; gap: 4px; min-width: 0; overflow: hidden; }
.breadcrumb a {
  color: var(--pen-fg-muted);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  &:hover { color: var(--pen-accent); }
}
.breadcrumb-sep { color: var(--pen-fg-muted); user-select: none; }

/* ---- buttons ---- */
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--pen-fg-muted);
  cursor: pointer;
  &:hover { background: var(--pen-border); color: var(--pen-fg); }
}

/* ---- sidebar ---- */
.sidebar {
  position: fixed;
  inset-block: 0;
  left: 0;
  width: var(--pen-sidebar-width);
  z-index: 20;
  display: flex;
  flex-direction: column;
  background: var(--pen-bg);
  border-right: 1px solid var(--pen-border);
  transform: translateX(-100%);
  transition: transform 0.25s ease;
}
.app-sidebar-open .sidebar { transform: translateX(0); }
.sidebar-files { flex: 1 1 auto; overflow-y: auto; padding: 8px 0; }
.sidebar-toc { flex: 2 1 auto; overflow-y: auto; border-top: 1px solid var(--pen-border); padding: 8px 0; }
.sidebar-footer {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  padding: 4px;
  border-top: 1px solid var(--pen-border);
}

.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 12px;
  border: none;
  background: transparent;
  color: var(--pen-fg);
  font-size: 0.875rem;
  text-align: left;
  cursor: pointer;
  & .file-name {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  &:hover { background: var(--pen-border); }
  &[aria-current='true'] { color: var(--pen-accent); }
}

/* ---- toc tree ---- */
.toc, .toc-children { list-style: none; margin: 0; padding: 0; }
.toc-row { display: flex; align-items: center; gap: 2px; }
.toc-toggle {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: var(--pen-fg-muted);
  cursor: pointer;
}
.toc-toggle-leaf { visibility: hidden; }
.toc-link {
  flex: 1;
  min-width: 0;
  padding: 3px 8px 3px 0;
  font-size: 0.8125rem;
  color: var(--pen-fg);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  &:hover { color: var(--pen-accent); }
}
.toc-link-active { color: var(--pen-accent); font-weight: 600; }

/* ---- toast ---- */
.toast {
  position: fixed;
  top: calc(var(--pen-header-height) + 12px);
  right: 12px;
  z-index: 100;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.875rem;
  opacity: 0;
  transform: translateY(-8px);
  pointer-events: none;
  transition: opacity 0.2s, transform 0.2s;
}
.toast-visible { opacity: 1; transform: translateY(0); }
.toast-success { background: #1a7f37; color: #fff; }
.toast-error { background: #cf222e; color: #fff; }
.toast-info { background: var(--pen-accent); color: #fff; }
.toast-warning { background: #9a6700; color: #fff; }

/* ---- skeleton ---- */
.skeleton {
  height: 14px;
  margin: 12px 0;
  border-radius: 4px;
  background: linear-gradient(90deg, var(--pen-border) 25%, var(--pen-fg-muted) 50%, var(--pen-border) 75%);
  background-size: 200% 100%;
  animation: pen-shimmer 1.4s infinite;
}
.skeleton-title { height: 28px; width: 40%; }
.skeleton-short { width: 65%; }
@keyframes pen-shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }

/* ---- markdown paper ---- */
.markdown-paper {
  max-width: 960px;
  margin: 16px auto;
  padding: 24px;
  border: 1px solid var(--pen-border);
  border-radius: 8px;
  background: var(--pen-paper);
}

/* ---- mermaid ---- */
.pen-mermaid-source { display: none; } /* hidden once rendered; Task 12 hook swaps in svg */
.mermaid-error {
  padding: 12px;
  border: 1px dashed #cf222e;
  color: var(--pen-fg);
  font-size: 0.85rem;
  white-space: pre-wrap;
}

/* ---- mobile ---- */
@media (width < 768px) {
  .app-main { margin-left: 0 !important; padding: 0 8px; }
  .app-header .icon-btn { display: inline-flex; } /* hamburger */
  .markdown-paper { margin: 8px auto; padding: 12px; border: none; }
  .app-backdrop {
    display: none;
    position: fixed;
    inset: 0;
    z-index: 15;
    background: var(--pen-backdrop);
  }
  .app-overlay-open {
    & .app-backdrop { display: block; }
    & .sidebar { box-shadow: 0 0 40px rgba(0 0 0 / 40%); }
  }
}
@media (width >= 768px) {
  .app-backdrop { display: none !important; }
}
```

（桌面上 `.app-sidebar-open` 持续显示侧栏；移动端打开的是 overlay——由 Task 12 的 drawer store 语义控制 class。）

**Step 5:** `src/index.client.tsx` 增加 `import './assets/base.css'`。`make dev` 验证样式无冲突（MUI 仍在但未使用这些类）。Commit：

```bash
git add -A && git commit -m "feat: hand-written ui foundation (icons, toast, skeleton, toggle, base css)"
```

---

### Task 12: 手写 UI——Sidebar / TocTree / Header 与 drawer store

**Files:** Create `src/pages/components/Sidebar.tsx`、`TocTree.tsx`、`NewHeader.tsx`（暂命名，Task 13 替换正式 Header）；Modify `src/store/modules/drawer.ts`。

**Step 1: DrawerStore 语义扩展**

```ts
export class DrawerStore implements PrefetchStore<DrawerState> {
  visible = false;   // desktop: persistent sidebar open
  overlay = false;   // mobile: overlay drawer open
  expandedToc: string[] = [];
  activeToc = '';

  toggle(value?: boolean) { this.visible = value ?? !this.visible; }
  openOverlay() { this.overlay = true; }
  closeOverlay() { this.overlay = false; }
  setActiveToc(id: string) { this.activeToc = id; }

  toggleToc(id: string) {
    this.expandedToc = this.expandedToc.includes(id)
      ? this.expandedToc.filter((x) => x !== id)
      : [...this.expandedToc, id];
  }
  // toc / subdirs getters 保持；expandToc reaction 保持（push 首层展开）
}
```

hydrate/dehydra 只序列化 `visible`（overlay 不持久化）。

**Step 2: TocTree.tsx**

```tsx
import { observer } from 'mobx-react-lite';
import { DocToc } from '@/types';
import { useStore } from '@/store';
import { scrollToHeading } from '@/store/hooks';
import Icon from './Icon';

const TocNode = observer(({ node, depth = 0 }: { node: DocToc; depth?: number }) => {
  const drawer = useStore('drawer');
  const expanded = drawer.expandedToc.includes(node.id);
  const hasChildren = node.children.length > 0;

  return (
    <li className="toc-node">
      <div className="toc-row" style={{ paddingInlineStart: depth * 14 }}>
        {hasChildren
          ? (
            <button
              type="button"
              className="toc-toggle"
              aria-label={expanded ? `Collapse ${node.text}` : `Expand ${node.text}`}
              aria-expanded={expanded}
              onClick={() => drawer.toggleToc(node.id)}
            >
              <Icon name={expanded ? 'chevronDown' : 'chevronRight'} size={14} />
            </button>
          )
          : <span className="toc-toggle toc-toggle-leaf" />}
        <a
          className={`toc-link ${drawer.activeToc === node.id ? 'toc-link-active' : ''}`}
          href={`#${node.id}`}
          onClick={(e) => { e.preventDefault(); scrollToHeading(node.id); }}
        >
          {node.text}
        </a>
      </div>
      {hasChildren && expanded && (
        <ul className="toc-children">
          {node.children.map((child) => <TocNode key={child.id} node={child} depth={depth + 1} />)}
        </ul>
      )}
    </li>
  );
});

const TocTree = observer(() => {
  const drawer = useStore('drawer');
  const toc = drawer.toc;
  if (!toc.length) return null;
  return (
    <nav className="sidebar-toc" aria-label="Table of contents">
      <ul className="toc">
        {toc.map((node) => <TocNode key={node.id} node={node} />)}
      </ul>
    </nav>
  );
});

export default TocTree;
```

**Step 3: Sidebar.tsx / NewHeader.tsx**

```tsx
// Sidebar.tsx
import { observer } from 'mobx-react-lite';
import clsx from 'clsx';
import { useStore } from '@/store';
import { useNav } from '@/store/hooks';
import Icon from './Icon';
import TocTree from './TocTree';

const Files = observer(() => {
  const home = useStore('home');
  const drawer = useStore('drawer');
  const nav = useNav();

  return (
    <div className="sidebar-files">
      {drawer.subdirs.map((doc) => (
        <button
          key={doc.relativePath}
          type="button"
          className="file-item"
          aria-current={home.reading === doc.relativePath || undefined}
          disabled={home.loading}
          onClick={() => nav(doc.relativePath)}
        >
          <Icon name={doc.type === 'directory' ? 'folder' : 'file'} size={16} />
          <span className="file-name">{doc.filename}</span>
        </button>
      ))}
    </div>
  );
});

const Sidebar = observer(() => {
  const drawer = useStore('drawer');
  return (
    <aside className="sidebar" data-open={drawer.visible}>
      <Files />
      <TocTree />
      <div className="sidebar-footer">
        <button type="button" className="icon-btn" aria-label="Back to top"
          onClick={() => window.scrollTo({ top: 0 })}>
          <Icon name="arrowUp" />
        </button>
        <button type="button" className="icon-btn" aria-label="Toggle sidebar"
          onClick={() => drawer.toggle()}>
          <Icon name={drawer.visible ? 'chevronLeft' : 'chevronRight'} />
        </button>
      </div>
    </aside>
  );
});

export default Sidebar;
```

```tsx
// NewHeader.tsx
import { observer } from 'mobx-react-lite';
import { Link } from 'react-router';
import { useStore } from '@/store';
import { useNav } from '@/store/hooks';
import Icon from './Icon';
import ThemeToggle from './Toggle';

const NewHeader = observer(() => {
  const ui = useStore('ui');
  const drawer = useStore('drawer');
  const socket = useStore('socket');
  const nav = useNav();

  return (
    <header className="app-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0, flex: 1 }}>
        <button type="button" className="icon-btn" aria-label="Open menu"
          onClick={() => drawer.openOverlay()}>
          <Icon name="menu" />
        </button>
        <nav className="breadcrumb" aria-label="breadcrumb">
          <Link to={socket.namespace} aria-label="Home" onClick={(e) => { e.preventDefault(); nav(socket.namespace); }}>
            <Icon name="home" size={16} />
          </Link>
          {ui.breadcrumb.map((link) => (
            <span key={link.relative} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, min-width: 0 }}>
              <span className="breadcrumb-sep">/</span>
              <Link to={link.relative} onClick={(e) => { e.preventDefault(); nav(link.relative); }}>
                {link.filename}
              </Link>
            </span>
          ))}
        </nav>
      </div>
      <ThemeToggle />
    </header>
  );
});

export default NewHeader;
```

（注意 `min-width: 0` 是 CSS 属性，JSX 里写 `minWidth: 0`——执行时修正此类笔误。）

**Step 4:** `make dev`（新组件尚未挂载，仅保证编译与类型通过）。Commit：

```bash
git add -A && git commit -m "feat: hand-written sidebar, toc tree and header components"
```

---

### Task 13: 总装——切换 Home/App/SSR 到新 UI，删除 MUI 与 emotion

**Files:** Rewrite `src/pages/Home.tsx`、`src/pages/components/Markdown.tsx`；Modify `src/App.tsx`、`src/index.server.tsx`、`src/index.client.tsx`、`src/store/hooks.ts`（useClipboard/useMermaid）、`package.json`；Delete `src/pages/components/Drawer.tsx`、`Header.tsx`（旧的）、`Toc.tsx`（旧的 MUI 版）、`src/createEmotionCache.ts`。

**Step 1: hooks 更新**

`useClipboard` 原生化（配合现有 rehype-copy 的 `.copy-btn[data-clipboard-text]` 标记，服务端插件不用改）：

```ts
export const useClipboard = () => {
  const ui = useStore('ui');

  useEffect(() => {
    const handler = async (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest?.('.copy-btn');
      if (!btn) return;
      const text = (btn as HTMLElement).dataset.clipboardText ?? '';
      try {
        await navigator.clipboard.writeText(text);
        ui.notify('success', 'Copied.');
      } catch {
        ui.notify('error', 'Copy failed.');
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);
};
```

（`pnpm remove clipboard`。）

`useMermaid`：

```ts
export const useMermaid = () => {
  const home = useStore('home');
  const theme = useStore('theme');

  useEffect(() => {
    const blocks = Array.from(document.querySelectorAll<HTMLElement>('code.pen-mermaid-source'));
    if (!blocks.length) return;

    let cancelled = false;

    import('mermaid').then(async (mod) => {
      const mermaid = mod.default;
      mermaid.initialize({
        startOnLoad: false,
        theme: theme.mode === 'dark' ? 'dark' : 'default',
      });

      for (const [i, block] of blocks.entries()) {
        if (cancelled) return;
        const source = block.textContent ?? '';
        const id = `pen-mermaid-${i}`;
        try {
          await mermaid.parse(source); // throws on syntax error
          const { svg } = await mermaid.render(id, source);
          const host = document.createElement('div');
          host.className = 'mermaid-svg';
          host.innerHTML = svg;
          block.replaceWith(host);
        } catch (err) {
          const errBox = document.createElement('div');
          errBox.className = 'mermaid-error';
          errBox.textContent = `Mermaid error: ${err instanceof Error ? err.message : String(err)}\n\n${source}`;
          block.replaceWith(errBox);
        }
      }
    });

    return () => { cancelled = true; };
  }, [home.html, theme.mode]);
};
```

（`home.html` 变化会整体重挂 markdown 容器——`dangerouslySetInnerHTML` 重建，所以渲染过的节点不会重复处理。）

**Step 2: Markdown.tsx / Home.tsx**

```tsx
// Markdown.tsx
import { observer } from 'mobx-react-lite';
import { Suspense, useRef } from 'react';
import { useStore } from '@/store';
import { createMarkup } from '@/utils';
import Skeleton from './Skeleton';

const Data = observer(() => {
  const home = useStore('home');
  // eslint-disable-next-line @typescript-eslint/no-throw-literal
  if (home.loadingTimeout) throw new Promise<void>((res) => res());
  return <div ref={useRef(null)} className="markdown-paper" dangerouslySetInnerHTML={createMarkup(home.html)} />;
});

const Markdown = observer(() => (
  <div className="markdown-body">
    <Suspense fallback={<Skeleton />}>
      <Data />
    </Suspense>
  </div>
));

export default Markdown;
```

```tsx
// Home.tsx
import { observer } from 'mobx-react-lite';
import clsx from 'clsx';
import { useStore } from '@/store';
import { useAutoFetch, useClipboard, useMermaid, useScrollSpy } from '@/store/hooks';
import Sidebar from './components/Sidebar';
import NewHeader from './components/NewHeader';
import Markdown from './components/Markdown';
import Toast from './components/Toast';

const Home = observer(() => {
  const drawer = useStore('drawer');

  useAutoFetch();
  useClipboard();
  useScrollSpy();
  useMermaid();

  return (
    <div className={clsx('app', {
      'app-sidebar-open': drawer.visible,
      'app-overlay-open': drawer.overlay,
    })}>
      <div className="app-backdrop" onClick={() => drawer.closeOverlay()} />
      <Sidebar />
      <div className="app-main">
        <NewHeader />
        <Markdown />
      </div>
      <Toast />
    </div>
  );
});

export default Home;
```

**Step 3: App / 入口 / SSR 去 emotion**

- `App.tsx`：去掉 `CacheProvider`，props 只剩 `{ store, routes }`。
- `index.client.tsx` / `index.server.tsx`：删 `createEmotionCache` import 与调用。
- `index.server.tsx`：删 `createEmotionServer`/`extractCriticalToChunks` 相关；`ctx.html` 替换链改为 Task 10 的 `applyTemplate`（静态 CSS 已在模板/占位符中）。
- 删除文件：`src/createEmotionCache.ts`、`Drawer.tsx`、`Header.tsx`、`Toc.tsx`（旧）。

**Step 4: 卸载依赖**

```bash
pnpm remove @mui/material @mui/icons-material @mui/lab @mui/styles @mui/x-tree-view @emotion/cache @emotion/react @emotion/server @emotion/styled clipboard deepmerge parse5
```

**Step 5: 全量验证**：`make lint && make build && pnpm test && pnpm test:e2e && make dev` 手动过一遍（导航、TOC、主题、复制、响应式 DevTools 模拟 375px 宽）。Commit：

```bash
git add -A && git commit -m "feat: replace mui/emotion with hand-written ui shell"
```

---

### Task 14: e2e 扩充 + 旧样式清理

**Files:** Modify `tests/e2e/home.spec.ts`、`src/assets/index.css`。

**Step 1:** e2e 补充：

```ts
test('anchor navigation from toc', async ({ page }) => {
  await page.goto('/');
  await page.locator('.toc-link', { hasText: '中文标题' }).first().click();
  await expect(page).toHaveURL(/#中文标题$/);
});

test('theme toggle persists', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /switch to (light|dark)/i }).click();
  const mode = await page.locator('html').getAttribute('data-theme');
  await expect(mode).toBeTruthy();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', mode!);
});

test('mermaid renders svg', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.mermaid-svg svg').first()).toBeVisible();
});

test('mobile overlay drawer', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open menu' }).click();
  await expect(page.locator('.sidebar')).toBeVisible();
  await page.locator('.app-backdrop').click();
});
```

（选择器按 Task 12/13 实际 DOM 调整；`tests/fixtures/README.md` 提供匹配内容。）

**Step 2:** `index.css` 清理：删除已死的 MUI 相关覆盖、`.drawer*` 类残留；确认 markdown 内容样式（container/copy-btn/hljs 圆角/media 字号）保留。

**Step 3:** Commit：

```bash
git add -A && git commit -m "test: cover anchors, theme, mermaid and mobile drawer"
```

---

### Task 15: 内存与渲染优化（LRU 字节化 + lowlight）

**Files:** Modify `src/server/reader.ts`、`src/store/modules/home.ts`；Rewrite `src/server/plugins/rehype-highlight.ts`；Create `tests/rehype-highlight.test.ts`。

**Step 1: LRU 按字节**（服务端 16MB / 客户端 8MB；近似尺寸 = 字符数 × 2）：

```ts
// reader.ts
const cache = new LRU<string, PenDirectoryData | PenMarkdownData & { ctime: number }>({
  maxSize: 16 * 1024 * 1024,
  sizeCalculation: (value) => {
    const reading = 'reading' in value && value.reading ? value.reading.content.length : 0;
    const content = 'content' in value ? value.content.length : 0;
    return (content + reading) * 2 + 2048;
  },
});
```

`home.ts` 客户端同样式（`maxSize: 8 * 1024 * 1024`，key 含 DEV 特判删除——统一按字节）。

**Step 2: TDD rehype-highlight** `tests/rehype-highlight.test.ts`：

```ts
import { it, expect } from 'vitest';
import { h } from 'hastscript';
import rehypeHighlight from '@/server/plugins/rehype-highlight';
import { makeCodeBlockPlugin } from '@/server/plugins/code-block';

const plugin = makeCodeBlockPlugin((lang, code) => rehypeHighlight(lang, code));

it('highlights javascript code blocks into spans', () => {
  const pre = h('pre', [h('code', { className: ['language-js'] }, 'const a = 1;')]);
  const tree = h('div', [pre]);
  plugin()(tree);
  const code = tree.children[0].children[0];
  expect(JSON.stringify(code)).toContain('hljs');
});

it('marks mermaid blocks without highlighting', () => {
  const pre = h('pre', [h('code', { className: ['language-mermaid'] }, 'graph TD; A-->B;')]);
  const tree = h('div', [pre]);
  plugin()(tree);
  const code = tree.children[0].children[0];
  expect(code.properties.className).toContain('pen-mermaid-source');
  expect(JSON.stringify(code)).not.toContain('hljs');
});
```

（`makeCodeBlockPlugin` 回调签名是 `(lang, code, pre, idx, parent)`——rehype-highlight 的默认导出当前就是 `makeCodeBlockPlugin((language, node) => ...)`，测试直接调用其内部回调需微调导出方式：把回调函数单独导出为 `highlightCodeBlock(lang, code)`，default 导出保持插件形态。以实际重构为准。）

**Step 3: lowlight 重写** `src/server/plugins/rehype-highlight.ts`：

```ts
import { createLowlight } from 'lowlight';
import xml from 'highlight.js/lib/languages/xml';
import bash from 'highlight.js/lib/languages/bash';
import c from 'highlight.js/lib/languages/c';
import cpp from 'highlight.js/lib/languages/cpp';
import css from 'highlight.js/lib/languages/css';
import markdown from 'highlight.js/lib/languages/markdown';
import diff from 'highlight.js/lib/languages/diff';
import go from 'highlight.js/lib/languages/go';
import java from 'highlight.js/lib/languages/java';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import lua from 'highlight.js/lib/languages/lua';
import makefile from 'highlight.js/lib/languages/makefile';
import plaintext from 'highlight.js/lib/languages/plaintext';
import python from 'highlight.js/lib/languages/python';
import rust from 'highlight.js/lib/languages/rust';
import scss from 'highlight.js/lib/languages/scss';
import yaml from 'highlight.js/lib/languages/yaml';
import typescript from 'highlight.js/lib/languages/typescript';
import wasm from 'highlight.js/lib/languages/wasm';

const languages = {
  xml, bash, c, cpp, css, markdown, diff, go, java,
  javascript, json, lua, makefile, plaintext, python,
  rust, scss, yaml, typescript, wasm,
};

const lowlight = createLowlight(languages);

export const highlightCodeBlock = (language: string, node: any) => {
  if (language === 'mermaid') {
    node.properties.className = ['pen-mermaid-source'];
    return;
  }
  if (!lowlight.registered(language)) return;
  try {
    node.children = lowlight.highlight(String(node.children?.[0]?.value ?? ''), { language }).children;
  } catch {
    // pass
  }
};

export default makeCodeBlockPlugin(highlightCodeBlock);
```

（别名：xml 覆盖 html；另注册 `lowlight.register('html', xml)`、`lowlight.register('js', javascript)`、`lowlight.register('ts', typescript)`、`lowlight.register('shell', bash)`、`lowlight.register('py', python)` 常见别名。**彻底删除 parse5 双重转换与 __dirname require 逻辑**。）

**Step 4:** `npx vitest run && make build && pnpm test:e2e`（代码高亮 e2e 里 js 块应仍带颜色）。`pnpm remove parse5 hast-util-from-parse5`（若 package.json 还在）。Commit：

```bash
git add -A && git commit -m "perf: byte-bounded lru caches and lowlight highlighting"
```

---

### Task 16: README 与收尾验证

**Files:** Modify `README.md`、`src/utils.ts`（`uuid` 若已无引用则删）。

**Step 1:** README 更新：Features 加 mermaid（客户端懒加载）与可读锚点说明；删除 Q&A 第 3 条（mermaid 拒绝理由）与 TODO 中已完成项（内存、footnote 遮挡）；CLI 文档补 `engines: node >= 20.19`。

**Step 2:** 全量回归：

```bash
make prepare && make lint && make build && pnpm test && pnpm test:e2e
make dev   # 手动:导航/TOC/锚点/主题/复制/mermaid/响应式/热更新(socket 改文件)
```

**Step 3:** 统计收益写入 commit message（`du -sh dist`、`ls -la dist/assets/*.js` 对比主包大小）。Commit：

```bash
git add -A && git commit -m "docs: update readme for mermaid and anchors"
```

---

## 风险与回退

| 风险 | 缓解 |
|---|---|
| vite 8 Rolldown 对 `ssr` ESM 输出/`rollupOptions` 兼容差异 | Task 1 以产物验收（`dist/*.mjs` 为 ESM）；必要时配置层换写法；终极回退 vite ^7（node/engine 兼容相同） |
| MUI×React 19 过渡期运行时问题 | Task 1 contingency：临时升 @mui/*@7；Phase 2 即删除 |
| react-router 8 `StaticRouter` 导出位置 | Task 3 Step 1 先 node 验证再改 import |
| rolldown 下 `import.meta.glob` eager 行为 | `make dev` 验证路由表；不行就手写静态路由表（只有一个页面） |
| mermaid 11 `render` 错误时污染 DOM | 已用 `mermaid.parse` 预检 + try/catch + 错误块替换 |
