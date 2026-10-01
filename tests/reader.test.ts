import fs from 'fs';
import path from 'path';
import { cache, readUnknown } from '@/server/reader';
import type { PenDirectoryData } from '@/types';
import { slash } from '@/utils';

const rootDir = slash(path.resolve(__dirname, 'temp-reader'));

// local mock: importing './setup' would register its global hooks, whose
// afterAll deletes tests/temp while the concurrent watcher suite uses it
const mockRemark = {
  render: {},
  usePlugins() { },
  process: (s: string) => Promise.resolve({ content: `!!TEST!! ${s}` }),
  processError: (s?: Error) => Promise.resolve({ message: s?.message ?? '' }),
};

const read = async (relative: string) => readUnknown({
  root: rootDir,
  relative,
  ignores: [],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  remark: mockRemark as any,
}) as Promise<PenDirectoryData>;

beforeEach(() => cache.clear());

beforeAll(() => {
  if (fs.existsSync(rootDir)) fs.rmSync(rootDir, { force: true, recursive: true });

  fs.mkdirSync(path.join(rootDir, 'all'), { recursive: true });
  fs.writeFileSync(path.join(rootDir, 'all', 'skill.md'), '# skill');
  fs.writeFileSync(path.join(rootDir, 'all', 'index.md'), '# index');
  fs.writeFileSync(path.join(rootDir, 'all', 'README.md'), '# readme');
  fs.writeFileSync(path.join(rootDir, 'all', 'aaa.md'), '# aaa');

  fs.mkdirSync(path.join(rootDir, 'index-skill'), { recursive: true });
  fs.writeFileSync(path.join(rootDir, 'index-skill', 'skill.md'), '# skill');
  fs.writeFileSync(path.join(rootDir, 'index-skill', 'index.md'), '# index');

  fs.mkdirSync(path.join(rootDir, 'skill-only'), { recursive: true });
  fs.writeFileSync(path.join(rootDir, 'skill-only', 'skill.md'), '# skill');
  fs.writeFileSync(path.join(rootDir, 'skill-only', 'zzz.md'), '# zzz');

  fs.mkdirSync(path.join(rootDir, 'plain'), { recursive: true });
  fs.writeFileSync(path.join(rootDir, 'plain', 'zzz.md'), '# zzz');
  fs.writeFileSync(path.join(rootDir, 'plain', 'aaa.md'), '# aaa');

  fs.mkdirSync(path.join(rootDir, 'nomd'), { recursive: true });
  fs.writeFileSync(path.join(rootDir, 'nomd', 'pixel.png'), '');

  fs.mkdirSync(path.join(rootDir, 'codeonly'), { recursive: true });
  fs.writeFileSync(path.join(rootDir, 'codeonly', 'app.ts'), 'const answer: number = 42;\n');
  fs.writeFileSync(path.join(rootDir, 'codeonly', 'zzz.toml'), 'a = 1\n');

  fs.mkdirSync(path.join(rootDir, 'mixed'), { recursive: true });
  fs.writeFileSync(path.join(rootDir, 'mixed', 'main.go'), 'package main\n');
  fs.writeFileSync(path.join(rootDir, 'mixed', 'readme.md'), '# readme');

  fs.mkdirSync(path.join(rootDir, 'entrypick'), { recursive: true });
  fs.writeFileSync(path.join(rootDir, 'entrypick', 'aaa.ts'), 'const a = 1;\n');
  fs.writeFileSync(path.join(rootDir, 'entrypick', 'main.py'), 'print(1)\n');

  fs.mkdirSync(path.join(rootDir, 'pypkg'), { recursive: true });
  fs.writeFileSync(path.join(rootDir, 'pypkg', 'aaa.py'), 'a = 1\n');
  fs.writeFileSync(path.join(rootDir, 'pypkg', '__init__.py'), '');

  fs.mkdirSync(path.join(rootDir, 'bigfile'), { recursive: true });
  fs.writeFileSync(path.join(rootDir, 'bigfile', 'big.ts'), 'x'.repeat(2 * 1024 * 1024 + 1));
});

afterAll(() => {
  fs.rmSync(rootDir, { force: true, recursive: true });
});

it('prefers README over index, skill and other markdown', async () => {
  const data = await read('/all/');
  expect(data.reading?.relativePath).toBe('/all/README.md');
});

it('prefers index over skill when no README', async () => {
  const data = await read('/index-skill/');
  expect(data.reading?.relativePath).toBe('/index-skill/index.md');
});

it('prefers skill when neither README nor index', async () => {
  const data = await read('/skill-only/');
  expect(data.reading?.relativePath).toBe('/skill-only/skill.md');
});

it('falls back to the first markdown in sort order', async () => {
  const data = await read('/plain/');
  expect(data.reading?.relativePath).toBe('/plain/aaa.md');
});

it('no markdown means no reading', async () => {
  const data = await read('/nomd/');
  expect(data.reading).toBeUndefined();
});

it('lists unsupported files alongside previewable ones', async () => {
  const data = await read('/nomd/');
  expect(data.children.map((c) => c.filename)).toContain('pixel.png');
});

it('falls back to the first code file when no markdown exists', async () => {
  const data = await read('/codeonly/');
  expect(data.reading).toMatchObject({ type: 'code', relativePath: '/codeonly/app.ts' });
});

it('prefers markdown over code for the reading', async () => {
  const data = await read('/mixed/');
  expect(data.reading?.relativePath).toBe('/mixed/readme.md');
});

it('prefers an entry file over the first code file in sort order', async () => {
  const data = await read('/entrypick/');
  expect(data.reading?.relativePath).toBe('/entrypick/main.py');
});

it('falls back through the entry tiers to package entries', async () => {
  const data = await read('/pypkg/');
  expect(data.reading?.relativePath).toBe('/pypkg/__init__.py');
});

it('code reading carries highlighted content', async () => {
  const data = await read('/codeonly/app.ts');
  expect(data.reading).toMatchObject({ type: 'code', language: 'typescript' });
  expect(decodeURIComponent(data.reading?.content ?? '')).toContain('hljs-keyword');
});

it('plain-text tier reads without highlight spans', async () => {
  const data = await read('/codeonly/zzz.toml');
  expect(data.reading).toMatchObject({ type: 'code', language: null });
  expect(decodeURIComponent(data.reading?.content ?? '')).toContain('a = 1');
  expect(decodeURIComponent(data.reading?.content ?? '')).not.toContain('hljs-');
});

it('rejects unsupported files when requested directly', async () => {
  await expect(read('/nomd/pixel.png')).rejects.toThrow('not a previewable file');
});

it('rejects oversized code files', async () => {
  await expect(read('/bigfile/big.ts')).rejects.toThrow('too large');
});
