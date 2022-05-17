/* eslint-disable @typescript-eslint/no-explicit-any */
import path from 'path';
import fs from 'fs';
import { createWatcher } from '@/server/watcher';
import {
  PenErrorData,
  PenMarkdownData,
  PenDirectoryData,
  WatcherOptions,
} from '@/types';
import { RemarkRehype } from '@/server/rehype';

jest.setTimeout(600000);

let watcher: ReturnType<typeof createWatcher>;

const logger = {
  ...console,
  done: console.log,
};
const remark = new RemarkRehype({
  logger,
  plugins: [],
});
const root = path.join(__dirname, 'test_temp');

const initWatcher = async (options?: Partial<WatcherOptions>, emit?: any) => {
  watcher = createWatcher({
    root,
    logger,
    remark,
    ignores: [],
    ...options,
  });
  watcher.setupEmit(emit);
  await watcher.setupWatching('/');
};
const makeEmitFn = (): [any[], jest.Mock<any, any>] => {
  const data: any[] = [];
  const emit = jest.fn().mockImplementation((_, x) => {
    console.log(performance.now(), x);
    data.push(x);
  });

  return [data, emit];
};

beforeAll(() => {
  if (fs.existsSync(root)) {
    fs.rmSync(root, {
      recursive: true,
    });
  }
  fs.mkdirSync(root);
  fs.mkdirSync(path.join(root, 'a'));
  fs.mkdirSync(path.join(root, 'a/b'));
  fs.writeFileSync(path.join(root, 'a.md'), '# A');
  fs.writeFileSync(path.join(root, 'a.txt'), 'aaa');
  fs.writeFileSync(path.join(root, 'a/b/b.markdown'), '# B');
  fs.writeFileSync(path.join(root, 'a/b/b.txt'), 'bbb');
});

afterAll(() => {
  fs.rmSync(root, {
    recursive: true,
  });
});

afterEach(() => {
  watcher?.close();
});

it('test init setupWatching dir', async () => {
  await initWatcher();

  expect(watcher.current?.type).toBe('directory');
  expect((watcher.current as PenDirectoryData)?.children.map((c) => c.relativePath)).toEqual([
    '/a',
    '/a.md',
  ]);
});

it('test init setupWatching md', async () => {
  await initWatcher({
    root: path.join(root, './a/b/b.markdown'),
  });

  expect(watcher.current?.type).toBe('markdown');
  expect((watcher.current as PenMarkdownData).content).toMatch(/B/);
});

it('test init setupWatching not exist', async () => {
  const [data, emit] = makeEmitFn();

  await initWatcher({
    root: path.join(root, 'a/b/b.md'),
  }, emit);

  expect(data[0].message).toMatch(/no such file or directory/);
});

it('test switchTo not exist', async () => {
  const [data, emit] = makeEmitFn();

  await initWatcher({}, emit);
  await watcher.setupWatching('/a/b/b.md');
  expect(data[1].message).toMatch(/no such file or directory/);
});

it('test init setupWatching not md', async () => {
  const [data, emit] = makeEmitFn();

  await initWatcher({}, emit);
  await watcher.setupWatching('/a/b/b.txt');
  expect(data[1].message).toMatch(/not a markdown file/);
});

it('test switchTo not md', async () => {
  const [data, emit] = makeEmitFn();

  await initWatcher({}, emit);
  await watcher.setupWatching('/a/b/b.markdown');
  await watcher.setupWatching('/a.txt');

  console.log(data);
  expect(data[2].message).toMatch(/not a markdown file/);
});

it('test init setupWatching ignored', async () => {
  const [data, emit] = makeEmitFn();

  await initWatcher({
    root: path.join(root, 'a'),
    ignores: [/^a/, /^b/],
  }, emit);

  expect(data[0].message).toMatch(/ignored by settings/);
});

it('test switchTo ignored', async () => {
  const [data, emit] = makeEmitFn();

  await initWatcher({
    ignores: [/^a\.md/],
  }, emit);
  await watcher.setupWatching('/a.md');

  expect(data[1].message).toMatch(/ignored by settings/);
});

it('test change content', async () => {
  const [data, emit] = makeEmitFn();

  await initWatcher({
    root: path.join(root, 'a.md'),
  }, emit);

  expect(watcher.current?.type).toBe('markdown');
  expect((watcher.current as PenMarkdownData).content).toMatch(/A/);

  expect(emit).toHaveBeenCalledTimes(1);
  expect((data[0] as PenMarkdownData).content).toMatch(/A/);

  fs.writeFileSync(path.join(root, 'a.md'), '# AAA');
  // wait for event
  await watcher.isReady();

  expect(emit).toHaveBeenCalledTimes(2);
  expect((data[1] as PenMarkdownData).content).toMatch(/AAA/);

  fs.writeFileSync(path.join(root, 'a.md'), '# BBB');
  // wait for event
  await watcher.isReady();

  expect(emit).toHaveBeenCalledTimes(3);
  expect((data[2] as PenMarkdownData).content).toMatch(/BBB/);
});

it('test change children', async () => {
  const [data, emit] = makeEmitFn();

  await initWatcher({
    root: path.join(root, 'a/b'),
  }, emit);

  expect(watcher.current?.type).toBe('directory');
  expect((watcher.current as PenDirectoryData).children.map((c) => c.relativePath)).toEqual([
    '/b.markdown',
  ]);
  expect(emit).toHaveBeenCalledTimes(1);
  expect((data[0] as PenDirectoryData).children.map((c) => c.relativePath)).toEqual([
    '/b.markdown',
  ]);

  fs.writeFileSync(path.join(root, 'a/b/c.md'), '# C');
  // wait for event
  await watcher.isReady();
  expect(emit).toHaveBeenCalledTimes(2);
  expect((data[1] as PenDirectoryData).children.map((c) => c.relativePath)).toEqual([
    '/b.markdown',
    '/c.md',
  ]);

  fs.writeFileSync(path.join(root, 'a/b/c.md'), '# CCC');
  await watcher.isReady();
  expect(emit).toHaveBeenCalledTimes(2);
});

it('test change nested', async () => {
  const [, emit] = makeEmitFn();

  await initWatcher({
    root: path.join(root, 'a'),
  }, emit);
  expect(emit).toHaveBeenCalledTimes(1);

  fs.writeFileSync(path.join(root, 'a/b/c.md'), '# C');
  // wait for event
  await watcher.isReady();
  expect(emit).toHaveBeenCalledTimes(1);
});

it('test change reading', async () => {
  const [data, emit] = makeEmitFn();

  await initWatcher({}, emit);

  await watcher.setupWatching('/a/b/b.markdown');
  expect(watcher.current?.relativePath).toBe('/a/b');

  await watcher.setupWatching('/a/b');
  expect(watcher.current?.relativePath).toBe('/a/b');
  expect((watcher.current as PenDirectoryData).reading).toBeUndefined(); // select parent

  await watcher.setupWatching('/a/b/b.markdown');
  expect(watcher.current?.relativePath).toBe('/a/b'); // watch target will not change if reading a child doc
  expect((watcher.current as PenDirectoryData).reading?.content).toMatch(/B/);

  fs.writeFileSync(path.join(root, 'a/b/b.markdown'), '# BBB');
  await watcher.isReady();

  expect(watcher.current?.relativePath).toBe('/a/b'); // watch target will not change if reading a child doc
  expect((data[4] as PenDirectoryData).reading?.content).toMatch(/BBB/);

  fs.unlinkSync(path.join(root, 'a/b/b.markdown'));
  await watcher.isReady();
  expect((data[5] as PenDirectoryData).reading).toBeUndefined();
});

it('test watch markdown error', async () => {
  const [data, emit] = makeEmitFn();

  await initWatcher({
    root: path.join(root, 'a.md'),
  }, emit);

  // remove current watching
  fs.unlinkSync(path.join(root, 'a.md'));
  await watcher.isReady();
  expect((data[1] as PenErrorData).message).toMatch(/no such file or directory/);

  fs.writeFileSync(path.join(root, 'd.md'), '# D');
  await watcher.isReady();
  await watcher.setupWatching('/d.md');
  expect((data[2] as PenErrorData).message).toMatch(/not permit/);
});

it('test watch dir error', async () => {
  const [, emit] = makeEmitFn();

  await initWatcher({
    ignores: [/b\.markdown$/],
  }, emit);
  await watcher.setupWatching('/a/b/b.markdown');

  fs.writeFileSync(path.join(root, 'a/b/e.md'), '# E');
  await watcher.isReady();
  await watcher.setupWatching('/a/b/e.md');
  await watcher.setupWatching('/a.txt');

  await watcher.setupWatching('/a/b');
  expect(watcher.current).not.toBeUndefined();
  await watcher.setupWatching('/a/b/e.md');
  expect((watcher.current as PenDirectoryData).reading?.content).toMatch(/E/);

  fs.writeFileSync(path.join(root, 'a/b/e.md'), '# EEE');
  await watcher.isReady();
  expect((watcher.current as PenDirectoryData).reading?.content).toMatch(/EEE/);
});

it('test change readme', async () => {
  const [data, emit] = makeEmitFn();

  await initWatcher({ ignores: [/b\.markdown$/] }, emit);

  const readme = path.join(root, 'Readme.md');

  fs.writeFileSync(readme, '# README');
  await watcher.isReady();
  expect(emit).toHaveReturnedTimes(2);
  expect((data[1] as PenDirectoryData).readme?.content).toMatch(/README/);

  // reading === readme
  await watcher.setupWatching('/Readme.md');
  fs.writeFileSync(readme, '# aaa');
  await watcher.isReady();
  expect((data[3] as PenDirectoryData).readme?.content).toMatch(/aaa/);
  expect((data[3] as PenDirectoryData).reading?.content).toMatch(/aaa/);

  fs.unlinkSync(readme);
  await watcher.isReady();
  expect((data[4] as PenDirectoryData).readme).toBeUndefined();
});

it('test ignore readme', async () => {
  const [, emit] = makeEmitFn();

  await initWatcher({ ignores: [/README/i] }, emit);

  const readme = path.join(root, 'Readme.md');
  fs.writeFileSync(readme, '# README');
  await watcher.isReady();
  expect(emit).toHaveReturnedTimes(1);
});
