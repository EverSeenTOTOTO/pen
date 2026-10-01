 
import fs from 'fs';
import path from 'path';
import { LRUCache } from 'lru-cache';
import type {
  PathInfo,
  PenMarkdownData,
  PenCodeData,
  PenDirectoryData,
  ReaderOptions,
} from '../types';
import {
  resolvePathInfo,
} from '../utils';
import { resolvePreview } from '../languages';
import { RemarkRehype } from './rehype';
import { highlightSource } from './plugins/rehype-highlight';

// shared watchability checks: settings and filesystem truth
function assertWatchable(pathInfo: PathInfo, ignores: RegExp[]) {
  if (ignores.some((re) => re.test(pathInfo.filename))) {
    throw new Error(`Pen not permitted to watch: ${pathInfo.fullpath}, it's ignored by settings.`);
  }

  if (!fs.existsSync(pathInfo.fullpath)) {
    throw new Error(`Pen not permitted to watch: ${pathInfo.fullpath}, no such file or directory.`);
  }
}

function validatePath(pathInfo: PathInfo, ignores: RegExp[]) {
  assertWatchable(pathInfo, ignores);

  if (pathInfo.type === 'other') {
    throw new Error(`Pen unable to watch: ${pathInfo.fullpath}, it's not a previewable file.`);
  }
}

function sortChildren(a: PathInfo, b: PathInfo) {
  if (a.type !== b.type && a.type === 'directory') return -1; // directory first
  // dot file first
  if (a.filename.startsWith('.') && b.filename.startsWith('.')) {
    return a.filename < b.filename ? -1 : 0;
  }
  if (a.filename.startsWith('.')) return -1;
  if (b.filename.startsWith('.')) return 1;

  return a.filename < b.filename ? -1 : 0;
}

// default reading preference: README first, then index, then skill, then
// whatever markdown sorts first, then the first code entry file, then the
// first code file — a directory without any previewable file has no
// reading and falls back to the client's file index
const READING_CANDIDATES = [
  /^readme\.(md|markdown)$/i,
  /^index\.(md|markdown)$/i,
  /^skill\.(md|markdown)$/i,
];

// entry file conventions: code directories are entered at index/main/app
// — give them the same reachability a markdown README gets
const ENTRY_CANDIDATES = [
  /^index\./i, // index.js / index.ts / index.vue / index.html …
  /^main\./i, // main.py / main.go / main.c / main.rs …
  /^app\./i, // app.ts / app.py / app.js …
  /^(server|cli|client)\./i, // service & tool entries
  /^(__init__|__main__)\.py$/i, // python package / runpy entries
  /^mod\.rs$/i, // rust module entry
];

function pickReading(children: Omit<PathInfo, 'fullpath'>[]): Omit<PathInfo, 'fullpath'> | undefined {
  for (const pattern of READING_CANDIDATES) {
    const hit = children.find((each) => each.type === 'markdown' && pattern.test(each.filename));
    if (hit) return hit;
  }

  if (children.some((each) => each.type === 'markdown')) {
    return children.find((each) => each.type === 'markdown');
  }

  const code = children.filter((each) => each.type === 'code');

  for (const pattern of ENTRY_CANDIDATES) {
    const hit = code.find((each) => pattern.test(each.filename));
    if (hit) return hit;
  }

  return code[0];
}

async function readMarkdown(render: RemarkRehype, pathInfo: PathInfo): Promise<PenMarkdownData> {
  const content = await fs.promises.readFile(pathInfo.fullpath, 'utf8');
  const data = await render.process(content);

  return {
    type: 'markdown',
    content: data.content,
    toc: data.toc,
    filename: pathInfo.filename,
    relativePath: pathInfo.relativePath,
  };
}

// guard against pathological inputs (generated IR, data dumps): the
// highlighted payload multiplies the source size several times over
const CODE_SIZE_LIMIT = 2 * 1024 * 1024;

async function readCode(pathInfo: PathInfo): Promise<PenCodeData> {
  const { size } = await fs.promises.stat(pathInfo.fullpath);

  if (size > CODE_SIZE_LIMIT) {
    throw new Error(`Pen unable to preview: ${pathInfo.fullpath}, file is too large (over 2MB).`);
  }

  const source = await fs.promises.readFile(pathInfo.fullpath, 'utf8');
  const { language } = resolvePreview(pathInfo.filename) ?? { language: null };

  return {
    type: 'code',
    content: encodeURIComponent(highlightSource(language, source)),
    language,
    filename: pathInfo.filename,
    relativePath: pathInfo.relativePath,
  };
}

async function readDirectory(root: string, pathInfo: PathInfo, ignores: RegExp[]): Promise<PenDirectoryData> {
  const dirs = await fs.promises.readdir(pathInfo.fullpath);
  const infos = dirs
    .map((dir) => resolvePathInfo(root, path.join(pathInfo.relativePath, dir)))
    .filter((info) => {
      try {
        // every entry is listed, previewable or not — only settings and
        // filesystem truth exclude a child
        assertWatchable(info, ignores);
        return true;
      } catch {
        return false;
      }
    });

  return {
    type: 'directory',
    filename: pathInfo.filename,
    relativePath: pathInfo.relativePath,
    children: infos.sort(sortChildren).map((c) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      delete c.fullpath;
      return c;
    }),
  };
}

// export for test
// byte-bounded: approximate entry size as character count * 2 (utf-16 code
// units), plus a fixed overhead for path/metadata
export const cache = new LRUCache<string, (PenDirectoryData | PenMarkdownData | PenCodeData) & { ctime: number }>({
  maxSize: 16 * 1024 * 1024,
  sizeCalculation: (value) => {
    const reading = 'reading' in value && value.reading ? value.reading.content.length : 0;
    const content = 'content' in value ? value.content.length : 0;
    return (content + reading) * 2 + 2048;
  },
});

export async function readUnknown(options: ReaderOptions) {
  const {
    root, relative, remark, ignores,
  } = options;
  const pathInfo = resolvePathInfo(root, relative);

  validatePath(pathInfo, ignores);

  const readCache = async (p: PathInfo) => {
    const record = cache.get(p.relativePath) as (PenDirectoryData | PenMarkdownData | PenCodeData) & { ctime: number } | null;
    const stat = await fs.promises.stat(p.fullpath);

    if (!record || stat.ctimeMs !== record.ctime) {
      const data = p.type === 'directory'
        ? await readDirectory(root, p, ignores)
        : p.type === 'markdown'
          ? await readMarkdown(remark, p)
          : await readCode(p);

      cache.set(p.relativePath, { ...data, ctime: stat.ctimeMs });

      return data;
    }

    return { ...record };
  };

  // if markdown, read its parent
  const directory = pathInfo.type === 'directory' ? pathInfo : resolvePathInfo(root, path.dirname(pathInfo.relativePath));
  const data = await readCache(directory) as PenDirectoryData;

  if (pathInfo.type === 'markdown' || pathInfo.type === 'code') {
    data.reading = await readCache(pathInfo) as PenMarkdownData | PenCodeData;
  } else {
    // pick a default reading for the directory by preference order
    const reading = pickReading(data.children);

    if (reading) {
      data.reading = reading.type === 'markdown'
        ? await readMarkdown(remark, resolvePathInfo(root, reading.relativePath))
        : await readCode(resolvePathInfo(root, reading.relativePath));
    }
  }

  return data;
}
