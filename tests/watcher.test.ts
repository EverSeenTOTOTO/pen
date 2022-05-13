import fs from 'fs';
import { path } from '@/utils';
import { Watcher } from '@/server/watcher';
import {
  PenData,
  PenErrorData,
  ServerEvents,
  PenMarkdownData,
  PenDirectoryData,
} from '@/types';

jest.setTimeout(60000);

let watcher: Watcher;

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
  expect(watcher.current).toBe(undefined);
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

  expect(watcher.current?.type).toBe('directory');
  expect((watcher.current as PenDirectoryData)?.children).toEqual([
    '/a',
    '/a.md',
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

  expect(watcher.current?.type).toBe('markdown');
  expect((watcher.current as PenMarkdownData).content).toMatch(/# B/);
});

it('test init setupWatching not exist', async () => {
  const emit = jest.fn().mockImplementation((evt, err) => {
    expect(evt).toBe(ServerEvents.PenError);
    expect(err.message).toMatch(/no such file or directory/);
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
    expect(err.message).toMatch(/no such file or directory/);
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

it('test switchTo not md', async () => {
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
    ignores: [/^\/a/, /^\/b/],
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
    ignores: [/^\/a\.md/],
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

  expect(watcher.current?.type).toBe('markdown');
  expect((watcher.current as PenMarkdownData).content).toMatch(/# A/);

  expect(emit).toHaveBeenCalledTimes(1);
  expect((data[0] as PenMarkdownData).content).toMatch(/# A/);

  fs.writeFileSync(path.join(root, 'a.md'), '# AAA');
  // wait for event
  await watcher.isReady();

  expect(emit).toHaveBeenCalledTimes(2);
  expect((data[1] as PenMarkdownData).content).toMatch(/# AAA/);

  fs.writeFileSync(path.join(root, 'a.md'), '# BBB');
  // wait for event
  await watcher.isReady();

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

  expect(watcher.current?.type).toBe('directory');
  expect((watcher.current as PenDirectoryData).children).toEqual([
    '/a/b/b.markdown',
  ]);

  expect(emit).toHaveBeenCalledTimes(1);
  expect((data[0] as PenDirectoryData).children).toEqual([
    '/a/b/b.markdown',
  ]);

  fs.writeFileSync(path.join(root, 'a/b/c.md'), '# C');
  // wait for event
  await watcher.isReady();
  expect(emit).toHaveBeenCalledTimes(2);
  expect((data[1] as PenDirectoryData).children).toEqual([
    '/a/b/b.markdown',
    '/a/b/c.md',
  ]);

  fs.writeFileSync(path.join(root, 'a/b/c.md'), '# CCC');
  await watcher.isReady();
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
  expect(emit).toHaveBeenCalledTimes(1);

  fs.writeFileSync(path.join(root, 'a/b/c.md'), '# C');
  // wait for event
  await watcher.isReady();
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
  expect(watcher.current?.relativePath).toBe('/a/b/b.markdown');

  await watcher.setupWatching('a/b');
  expect(watcher.current?.relativePath).toBe('/a/b');
  expect((watcher.current as PenDirectoryData).reading).toBeUndefined(); // select parent

  await watcher.setupWatching('a/b/b.markdown');
  expect(watcher.current?.relativePath).toBe('/a/b'); // watch target will not change if reading a child doc
  expect((watcher.current as PenDirectoryData).reading?.content).toMatch(/# B/);

  await watcher.setupWatching('a/b');
  expect((watcher.current as PenDirectoryData).reading).toBeUndefined(); // back to parent, clear reading

  await watcher.setupWatching('a/b/b.markdown'); // read child again

  fs.writeFileSync(path.join(root, 'a/b/b.markdown'), '# BBB');
  await watcher.isReady();

  expect(watcher.current?.relativePath).toBe('/a/b'); // watch target will not change if reading a child doc
  expect(emit).toHaveBeenCalledTimes(7);
  expect((data[6] as PenDirectoryData).reading?.content).toMatch(/# BBB/);

  fs.unlinkSync(path.join(root, 'a/b/b.markdown'));
  await watcher.isReady();
  expect(emit).toHaveBeenCalledTimes(8);
  expect((data[7] as PenDirectoryData).reading).toBeUndefined();
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
  await watcher.isReady();
  expect((data[1] as PenErrorData).message).toMatch(/no such file or directory/);

  fs.writeFileSync(path.join(root, 'd.md'), '# D');
  await watcher.isReady();
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
  await watcher.isReady();
  await watcher.setupWatching('a/b/e.md');
  await watcher.setupWatching('a.txt');

  expect(watcher.current).toBeUndefined();

  await watcher.setupWatching('a/b');
  expect(watcher.current).not.toBeUndefined();
  await watcher.setupWatching('a/b/e.md');
  expect((watcher.current as PenDirectoryData).reading?.content).toMatch(/# E/);

  fs.writeFileSync(path.join(root, 'a/b/e.md'), '# EEE');
  await watcher.isReady();
  expect((watcher.current as PenDirectoryData).reading?.content).toMatch(/# EEE/);
});

it('test change readme', async () => {
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
  await watcher.setupWatching('.');

  const readme = path.join(root, 'Readme.md');

  fs.writeFileSync(readme, '# README');
  await watcher.isReady();
  expect(emit).toHaveReturnedTimes(2);
  expect((data[1] as PenDirectoryData).readme?.content).toMatch(/# README/);

  fs.writeFileSync(readme, '# aaa');
  await watcher.isReady();
  expect(emit).toHaveReturnedTimes(3);
  expect((data[2] as PenDirectoryData).readme?.content).toMatch(/# aaa/);

  fs.unlinkSync(readme);
  await watcher.isReady();
  expect(emit).toHaveReturnedTimes(4);
  expect((data[3] as PenDirectoryData).readme).toBeUndefined();
});

it('test ignore readme', async () => {
  const data: PenData[] = [];
  const emit = jest.fn().mockImplementation((_, x) => {
    data.push(x);
  });

  watcher = new Watcher({
    emit,
    logger,
    ignores: [/README/i],
    watchRoot: root,
  });
  await watcher.setupWatching('.');

  const readme = path.join(root, 'Readme.md');
  fs.writeFileSync(readme, '# README');
  await watcher.isReady();
  expect(emit).toHaveReturnedTimes(1);
});
