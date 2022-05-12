import path from 'path';
import fs from 'fs';
import { Watcher } from '@/server/watcher';
import {
  PenData, PenDirectoryData, PenErrorData, PenMarkdownData, ServerEvents,
} from '@/types';

jest.setTimeout(60000);

let watcher: Watcher;

const sleep = (time: number) => new Promise((res) => setTimeout(res, time));
const root = path.join(__dirname, 'test_temp');
const logger = {
  ...console,
  done: () => {},
  clearConsole: () => {},
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

it('test ctor', async () => {
  watcher = new Watcher({
    watchRoot: root,
    ignores: [],
    emit: () => {},
  });
  expect(await watcher.currentCache).toBe(undefined);
});

it('test init setupWatching dir', async () => {
  const emit = jest.fn();

  watcher = new Watcher({
    emit,
    logger,
    ignores: [],
    watchRoot: root,
  });
  await watcher.setupWatching('.');

  const current = await watcher.currentCache;

  expect(current?.type).toBe('directory');
  expect((current as PenDirectoryData)?.children).toEqual([
    'a',
    'a.md',
  ]);
});

it('test init setupWatching md', async () => {
  const emit = jest.fn();

  watcher = new Watcher({
    emit,
    logger,
    ignores: [],
    watchRoot: root,
  });
  await watcher.setupWatching('a/b/b.markdown');

  const current = await watcher.currentCache;
  expect(current?.type).toBe('markdown');
  expect((current as PenMarkdownData).content).toMatch(/# B/);
});

it('test init setupWatching not exist', async () => {
  const emit = jest.fn().mockImplementation((evt, err) => {
    expect(evt).toBe(ServerEvents.PenError);
    expect(err.message).toMatch(/file doesn't exist/);
  });

  watcher = new Watcher({
    emit,
    logger,
    ignores: [],
    watchRoot: root,
  });
  await watcher.setupWatching('a/b/b.md');
});

it('test switchTo not exist', async () => {
  let first = true;
  const emit = jest.fn().mockImplementation((evt, err) => {
    if (first) {
      first = false;
      return; // ignore setup trigger
    }
    expect(evt).toBe(ServerEvents.PenError);
    expect(err.message).toMatch(/file doesn't exist/);
  });

  watcher = new Watcher({
    emit,
    logger,
    ignores: [],
    watchRoot: root,
  });

  await watcher.setupWatching('a');
  await watcher.setupWatching('a/b/b.md');
});

it('test init setupWatching not md', async () => {
  const emit = jest.fn().mockImplementation((evt, err) => {
    expect(evt).toBe(ServerEvents.PenError);
    expect(err.message).toMatch(/not a markdown file/);
  });

  watcher = new Watcher({
    emit,
    logger,
    ignores: [],
    watchRoot: root,
  });
  await watcher.setupWatching('a/b/b.txt');
});

it('test init switchTo not md', async () => {
  let first = true;
  const emit = jest.fn().mockImplementation((evt, err) => {
    if (first) {
      first = false;
      return; // ignore setup trigger
    }
    expect(evt).toBe(ServerEvents.PenError);
    expect(err.message).toMatch(/not a markdown/);
  });

  watcher = new Watcher({
    emit,
    logger,
    ignores: [],
    watchRoot: root,
  });

  await watcher.setupWatching('a/b/b.markdown');
  await watcher.setupWatching('a.txt');
});

it('test init setupWatching ignored', async () => {
  const emit = jest.fn().mockImplementation((evt, err) => {
    expect(evt).toBe(ServerEvents.PenError);
    expect(err.message).toMatch(/ignored by settings/);
  });

  watcher = new Watcher({
    emit,
    logger,
    ignores: [/^a/, /^b/],
    watchRoot: root,
  });
  await watcher.setupWatching('a');
});

it('test switchTo ignored', async () => {
  let first = true;
  const emit = jest.fn().mockImplementation((evt, err) => {
    if (first) {
      first = false;
      return; // ignore setup trigger
    }
    expect(evt).toBe(ServerEvents.PenError);
    expect(err.message).toMatch(/ignored by settings/);
  });

  watcher = new Watcher({
    emit,
    logger,
    ignores: [/^a\.md/],
    watchRoot: root,
  });

  await watcher.setupWatching('a');
  await watcher.setupWatching('a.md');
});

it('test change content', async () => {
  const data: PenData[] = [];
  const emit = jest.fn().mockImplementation((_, x) => {
    data.push(x);
  });

  watcher = new Watcher({
    emit,
    logger,
    ignores: [],
    watchRoot: root,
  });
  await watcher.setupWatching('a.md');

  const current = await watcher.currentCache;
  expect(current?.type).toBe('markdown');
  expect((current as PenMarkdownData).content).toMatch(/# A/);

  expect(emit).toHaveBeenCalledTimes(1);
  expect((data[0] as PenMarkdownData).content).toMatch(/# A/);

  fs.writeFileSync(path.join(root, 'a.md'), '# AAA');
  // wait for event
  await sleep(300);

  expect(emit).toHaveBeenCalledTimes(2);
  expect((data[1] as PenMarkdownData).content).toMatch(/# AAA/);

  fs.writeFileSync(path.join(root, 'a.md'), '# BBB');
  // wait for event
  await sleep(300);

  expect(emit).toHaveBeenCalledTimes(3);
  expect((data[2] as PenMarkdownData).content).toMatch(/# BBB/);
});

it('test change children', async () => {
  const data: PenData[] = [];
  const emit = jest.fn().mockImplementation((_, x) => {
    data.push(x);
  });

  watcher = new Watcher({
    emit,
    logger,
    ignores: [],
    watchRoot: root,
  });
  await watcher.setupWatching('a/b');

  const current = await watcher.currentCache;
  expect(current?.type).toBe('directory');
  expect((current as PenDirectoryData).children).toEqual([
    'a/b/b.markdown',
  ]);

  expect(emit).toHaveBeenCalledTimes(1);
  expect((data[0] as PenDirectoryData).children).toEqual([
    'a/b/b.markdown',
  ]);

  fs.writeFileSync(path.join(root, 'a/b/c.md'), '# C');
  // wait for event
  await sleep(300);
  expect(emit).toHaveBeenCalledTimes(2);
  expect((data[1] as PenDirectoryData).children).toEqual([
    'a/b/b.markdown',
    'a/b/c.md',
  ]);

  fs.mkdirSync(path.join(root, 'a/b/c'));
  await watcher.setupWatching('a/b/c');
  expect(emit).toHaveBeenCalledTimes(3);
  // unable to detect deleting root
  fs.rmSync(path.join(root, 'a/b/c'), { recursive: true });

  expect(emit).toHaveBeenCalledTimes(3);
});

it('test change nested', async () => {
  const data: PenData[] = [];
  const emit = jest.fn().mockImplementation((_, x) => {
    data.push(x);
  });

  watcher = new Watcher({
    emit,
    logger,
    ignores: [],
    watchRoot: root,
  });
  await watcher.setupWatching('a');

  fs.writeFileSync(path.join(root, 'a/b/c.md'), '# C');
  // wait for event
  await sleep(300);
  expect(emit).toHaveBeenCalledTimes(1);
});

it('test change reading', async () => {
  const data: PenData[] = [];
  const emit = jest.fn().mockImplementation((_, x) => {
    data.push(x);
  });

  watcher = new Watcher({
    emit,
    logger,
    ignores: [],
    watchRoot: root,
  });

  await watcher.setupWatching('a');
  await watcher.setupWatching('a/b/b.markdown');

  let current = await watcher.currentCache;
  expect(current?.relativePath).toBe('a/b/b.markdown');

  await watcher.setupWatching('a/b');
  current = await watcher.currentCache;
  expect(current?.relativePath).toBe('a/b');
  expect((current as PenDirectoryData).reading).toBeUndefined(); // select parent

  await watcher.setupWatching('a/b/b.markdown');
  current = await watcher.currentCache;
  expect(current?.relativePath).toBe('a/b'); // watch target will not change if reading a child doc
  expect((current as PenDirectoryData).reading?.content).toMatch(/# B/);

  await watcher.setupWatching('a/b');
  current = await watcher.currentCache;
  expect((current as PenDirectoryData).reading).toBeUndefined(); // back to parent, clear reading

  await watcher.setupWatching('a/b/b.markdown'); // read child again
  fs.writeFileSync(path.join(root, 'a/b/b.markdown'), '# BBB');
  await sleep(300);

  expect(emit).toHaveBeenCalledTimes(6);
  expect((data[5] as PenDirectoryData).reading?.content).toMatch(/# BBB/);
});

it('test watch markdown error', async () => {
  const data: PenData[] = [];
  const emit = jest.fn().mockImplementation((_, x) => {
    data.push(x);
  });

  watcher = new Watcher({
    emit,
    logger,
    ignores: [],
    watchRoot: root,
  });
  await watcher.setupWatching('a.md');

  // remove current watching
  fs.unlinkSync(path.join(root, 'a.md'));
  await sleep(300);
  expect((data[1] as PenErrorData).message).toMatch(/file doesn't exist/);

  fs.writeFileSync(path.join(root, 'd.md'), '# D');
  await watcher.setupWatching('d.md');
  expect(emit).toHaveBeenCalledTimes(3);
  expect((data[2] as PenMarkdownData).content).toMatch(/# D/);
});

it('test watch dir error', async () => {
  const data: PenData[] = [];
  const emit = jest.fn().mockImplementation((_, x) => {
    data.push(x);
  });

  watcher = new Watcher({
    emit,
    logger,
    ignores: [/b\.markdown$/],
    watchRoot: root,
  });
  await watcher.setupWatching('a/b');
  await watcher.setupWatching('a/b/b.markdown');

  fs.writeFileSync(path.join(root, 'a/b/e.md'), '# E');
  await watcher.setupWatching('a/b/e.md');
  await watcher.setupWatching('a.txt');

  let current = await watcher.currentCache;
  expect(current).toBeUndefined();

  await watcher.setupWatching('a/b');
  await watcher.setupWatching('a/b/e.md');
  current = await watcher.currentCache;
  expect((current as PenDirectoryData).reading?.content).toMatch(/# E/);

  fs.writeFileSync(path.join(root, 'a/b/e.md'), '# EEE');
  await sleep(300);
  current = await watcher.currentCache;
  expect((current as PenDirectoryData).reading?.content).toMatch(/# EEE/);
});
