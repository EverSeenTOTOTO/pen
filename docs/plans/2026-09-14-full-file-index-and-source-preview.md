# 目录全量索引与源码预览

**Goal:** 目录页列出全部条目（不再只显示 markdown 与子目录）；新增 `code` 文件种类，以高亮源码视图预览代码/配置文件；`other` 条目点击后原地 toast「不支持预览」；reading 兜底链扩展到 code 文件。

**Architecture:** 文件种类四分类 `directory | markdown | code | other`，预览能力由种类派生。新增语言映射模块作为 code 白名单的唯一权威出处，产出三档结果（有语法 → 高亮；已知纯文本 → plaintext；不在表内 → other）。源码预览复用服务端 lowlight 设施（`highlightCodeBlock`），不经 markdown 管线。`PenCodeData` 与 `PenMarkdownData` 平级，共享 `content` 字段以复用客户端注入与缓存逻辑。

**Tech Stack:** 不新增依赖（源码序列化用 unified + rehype-stringify，已在依赖内）；hljs 新注册语法均随 highlight.js 自带。

---

## 领域共识（Ubiquitous Language）

| 术语 | 含义 |
| --- | --- |
| 条目 (Entry) | 目录页里列出的一行：文件或子目录 |
| 文件种类 (File Kind) | `directory` / `markdown` / `code` / `other` |
| 可预览 (Previewable) | pen 能渲染内容的条目：markdown、code；directory 可导航 |
| 源码视图 (Source Preview) | code 文件的渲染形态：高亮（或纯文本）代码块，无 toc |
| 语言映射 (Language Mapping) | 文件名 → 预览档位的纯查表；code 白名单的唯一权威出处 |
| Reading（默认阅读） | 目录页自动选中的展示文档，优先级扩展为 README → index → skill → 第一个 markdown → 第一个 code |

**已确认的决策：**
1. code 边界 = 扩展名白名单 + 知名无扩展名文件名（Dockerfile、Makefile、CMakeLists.txt、LICENSE、PKGBUILD…），不做内容探测。
2. 点击 `other` 条目 → 原地 toast，不跳转、不发请求、不产生历史记录。
3. 目录无 markdown 但有 code 文件时，reading 落在第一个 code 文件。
4. 图片/媒体本期不做，归 `other`。
5. `.txt` 不收（唯一例外：`CMakeLists.txt` 按文件名特判为 cmake）。
6. `.log` 不收。

## 语言映射表（最终版，已按 ~/repos 真实分布校准）

**① 有语法 → 高亮：**

| 类别 | 映射 |
| --- | --- |
| Web/标记 | `html` `htm` `xml` `svg` `plist` → xml；`vue` → xml（近似）；`css` → css；`scss` → scss；`js` `mjs` `cjs` `jsx` → javascript；`ts` `mts` `cts` `tsx` → typescript（tsx 近似）；`json` `ipynb` → json |
| 脚本 | `py` → python；`sh` `bash` `zsh` + `PKGBUILD` `.zshrc` `.profile` `.bashrc` → bash；`lua` → lua；`vim` `.vimrc` → vim；`scm` `ss` `rkt` → scheme（rkt 近似） |
| 系统语言 | `c` `h` `inc` → c；`cpp` `cc` `c++` `hpp` `hh` `cu` `hip` `cppm` → cpp；`rs` → rust；`go` → go；`java` → java；`m` `mm` → objectivec；`s` `S` `asm` → x86asm（近似）；`hlsl` → glsl（近似）；`ll` → llvm |
| 配置 | `yml` `yaml` `.clang-format` `.clang-tidy` → yaml；`cmake` + `CMakeLists.txt` → cmake；`.gitmodules` `.npmrc` `.coveragerc` `.SRCINFO` `.PKGINFO` `.env` `.editorconfig` → ini；`Makefile` `makefile` → makefile；`Dockerfile` → dockerfile；`.prettierrc` → json |
| 其他 | `diff` `patch` → diff；`wat` `wast` → wasm |

**② 已知纯文本、无语法 → plaintext 档（无高亮但可读）：**
`toml`、`rst`、`mlir`、`mir`、`td`、`fir`、`csv`、`po`、`in`、`def`、`gn`、`modulemap`、`.gitignore`、`.dockerignore`、`LICENSE`（文件名）

**③ `other`（不支持预览）：** 白名单外的一切及二进制（`o` `a` `so` `dylib` `gz` `png` `webp` `dat` …）。

---

## Task 1: 语言映射模块 + 类型扩展（TDD）

**Files:**
- Create: `src/languages.ts`
- Modify: `src/types.ts`、`src/utils.ts`
- Create: `tests/languages.test.ts`

**Steps:**
1. `src/languages.ts`：纯数据查表。
   - 文件名特判表（大小写不敏感）：`dockerfile`、`makefile`、`cmakelists.txt`、`license`、`pkgbuild`…
   - 扩展名表：如上节映射。
   - `resolvePreview(filename: string): { language: string | null } | undefined`——先整名匹配，再扩展名匹配；`language: null` 表示 plaintext 档；`undefined` 表示 `other`。
2. `src/types.ts`：`PathInfo.type` 增加 `'code'`；新增 `PenCodeData { type: 'code'; filename; relativePath; content: string; language: string | null }`；`PenDirectoryData.reading?: PenMarkdownData | PenCodeData`。
3. `src/utils.ts` `resolvePathInfo`：`type` 判定改为 `isDirectory ? 'directory' : isMarkdown ? 'markdown' : resolvePreview(fullpath) !== undefined ? 'code' : 'other'`。
4. 单测覆盖：知名文件名、大小写不敏感、plaintext 档返回 null、白名单外返回 undefined、`.txt` 落 other、`CMakeLists.txt` 特判。

## Task 2: 服务端读取与高亮

**Files:**
- Modify: `src/server/reader.ts`、`src/server/plugins/rehype-highlight.ts`
- Modify: `tests/reader.test.ts`、`tests/rehype-highlight.test.ts`

**Steps:**
1. `rehype-highlight.ts`：
   - 新注册语法：`llvm`、`vim`、`objectivec`、`cmake`、`glsl`、`x86asm`、`ini`、`scheme`（均在 highlight.js/lib/languages 内，无需新依赖）。
   - 导出 `highlightSource(language: string | null, source: string): string`：构造 synthetic hast `<code class="language-x">` 元素 → 复用 `highlightCodeBlock` → rehype-stringify 序列化为 `<pre>` 片段；`language === null` 时只做 HTML 转义输出纯文本 `<pre><code>`。
2. `reader.ts`：
   - `validatePath` 拆分：目录枚举的过滤只保留 ignores + 存在性校验；对**顶层请求路径**才拒绝 `other`，错误文案改为 "it's not a previewable file"。
   - `readDirectory`：children 不再丢弃 `other`（`ignores` 照旧生效，`fullpath` 照旧删除）。
   - 新增 `readCode(pathInfo)`：读文件 → 超过 **2MB** 抛 "file too large to preview" → `highlightSource` → 返回 `PenCodeData`（走同一 LRU 缓存，sizeCalculation 已兼容 content 字段）。
   - `readUnknown`：`markdown` → `readMarkdown`，`code` → `readCode`。
   - `pickReading`：现有 markdown 候选之后兜底 `children.find(c => c.type === 'code')`。
3. watcher 无需改动：`change` 事件的 `reading.relativePath` 比较对 code 文件天然生效（编辑 .ts 实时刷新，与 .md 一致）。
4. 单测：reader 列出 other 条目、code 读取高亮、大小上限、pickReading 兜底链、深链请求 other 报错文案。

## Task 3: 客户端交互

**Files:**
- Modify: `src/pages/components/FileIndex.tsx`、`src/pages/components/Icon.tsx`、`src/store/modules/home.ts`（reading 联合类型标注）
- Modify: `tests/ui.test.ts`

**Steps:**
1. `FileIndex.tsx`：onClick 分流——`doc.type === 'other'` 时 `ui.notify('info', '不支持预览：' + doc.filename)`，不导航；`directory`/`markdown`/`code` 照常 `nav(doc.relativePath)`。
2. `Icon.tsx`：新增 `code` 图标（`</>` 简笔 SVG），FileIndex 对 `code` 条目使用。
3. `home.html` getter 无需改动（`reading.content` 两类共用）；toc 对 code 为 undefined，行为与无 toc 目录一致。

## Task 4: e2e 与文档

**Files:**
- Modify: `tests/e2e/home.spec.ts`、`tests/fixtures/`（新增 `sample.ts`、`config.toml`、二进制占位文件）
- Modify: `README.md`

**Steps:**
1. e2e：目录页列出非 md 条目；点击二进制 → 出现 toast 且 URL 不变；点击 `.ts` → 高亮代码视图；纯代码目录 reading 落在 code 文件。
2. README Syntax/功能段补充源码预览说明。

---

**验证：** `pnpm test`（vitest 单测）、`pnpm test:e2e`（playwright）、`make dev` 手动在 pen 仓库自身目录上 dogfood（能看到 `cli.mjs`、`makefile`、`commitlint.config.js` 的源码视图）。
