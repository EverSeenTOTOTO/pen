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
