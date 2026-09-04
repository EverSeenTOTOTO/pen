/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { vi } from 'vitest';
import { Watcher } from '@/server/watcher';
import type { PenDirectoryData, PenErrorData, WatcherOptions } from '@/types';
import { logger } from '@/server/logger';
import path from 'path';
import fs from 'fs';
import chokidar from 'chokidar';
import {
  mdA, mdb, rootDir, MockChokidar, dirA, mockRemark, dirAB,
} from './setup';

vi.mock('chokidar', () => ({
  default: { watch: vi.fn() },
}));
// @ts-ignore
vi.spyOn(chokidar, 'watch').mockImplementation((root: string, options: unknown) => new MockChokidar(root, options));

const createWatcher = (opts?: Partial<WatcherOptions>) => new Watcher({
  logger,
  root: rootDir,
  ignores: [],
  ...opts,
  // @ts-ignore
  remark: mockRemark,
});

afterEach(async () => {
  await new Promise<void>((resolve) => { setTimeout(resolve, 100); });
});

it('test watcher', async () => {
  const watcher = createWatcher();

  await watcher.setupWatching('/');

  expect(watcher.watcher).toBeInstanceOf(MockChokidar);
  expect(watcher.root).toBe(rootDir);
  await watcher.close();
});

it('test watch root', async () => {
  const watcher = createWatcher();
  const emitted = new Promise<PenDirectoryData>((resolve) => {
    watcher.setupEmit((_, data) => resolve(data as PenDirectoryData));
  });

  await watcher.setupWatching('/');

  const dir = await emitted;

  expect(dir.relativePath).toBe('/');
  expect(dir.children.length).toBe(2);
  await watcher.close();
});

it('test ignores', async () => {
  const watcher = createWatcher({
    ignores: [/A/],
  });
  const emitted = new Promise<PenDirectoryData>((resolve) => {
    watcher.setupEmit((_, data) => resolve(data as PenDirectoryData));
  });

  await watcher.setupWatching('/');

  const dir = await emitted;

  expect(dir.children.length).toBe(0);
  await watcher.close();
});

it('test jumpTo nested', async () => {
  const watcher = createWatcher();
  const datas: any[] = [];

  watcher.setupEmit((_, data) => {
    datas.push(data);
  });

  await watcher.setupWatching('/');
  await watcher.setupWatching('/A/b.md');

  expect(datas[0].relativePath).toBe('/');
  expect(datas[1].relativePath).toBe('/A/');
  expect(datas[1].reading).not.toBeUndefined();

  await watcher.close();
});

it('test change', async () => {
  const watcher = createWatcher();

  await watcher.setupWatching('/A/b.md');

  const emitted = new Promise<PenDirectoryData>((resolve) => {
    watcher.setupEmit((_, data) => resolve(data as PenDirectoryData));
  });

  fs.writeFileSync(mdb, '# change');
  watcher.watcher?.emit('all', 'change', mdb);

  const dir = await emitted;

  expect(dir.reading?.content).toMatch(/!!TEST!! # change/);
  await watcher.close();
});

it('test addDir', async () => {
  const watcher = createWatcher();

  const first = new Promise<PenDirectoryData>((resolve) => {
    watcher.setupEmit((_, data) => resolve(data as PenDirectoryData));
  });

  await watcher.setupWatching('/A/b.md');

  const second = new Promise<PenDirectoryData>((resolve) => {
    watcher.setupEmit((_, data) => resolve(data as PenDirectoryData));
  });

  const dir = path.join(dirA, 'dir');
  fs.mkdirSync(dir);
  watcher.watcher?.emit('all', 'addDir', dir);

  expect((await first).children.length).toBe(2);
  expect((await second).children.length).toBe(3);
  await watcher.close();
});

it('test rm watching', async () => {
  const watcher = createWatcher();

  await watcher.setupWatching('/A.md');

  const emitted = new Promise<PenErrorData>((resolve) => {
    watcher.setupEmit((_, data) => resolve(data as PenErrorData));
  });

  fs.rmSync(mdA);
  watcher.watcher?.emit('all', 'unlink', mdA);

  const err = await emitted;

  expect(err.message).toMatch(/no such file or directory/);
  await watcher.close();
});

it('test add readme', async () => {
  const watcher = createWatcher();
  const datas: any[] = [];

  watcher.setupEmit((_, data) => {
    datas.push(data);
    if (datas.length >= 2) {
      expect(datas[0].reading?.content).toMatch(/!!TEST!! # README/);
      expect(datas[1].reading?.content).toMatch(/!!TEST!! # README changed/);
    }
  });

  await watcher.setupWatching('/');

  const emitted = new Promise<PenDirectoryData>((resolve) => {
    watcher.setupEmit((_, data) => resolve(data as PenDirectoryData));
  });

  const readme = path.join(rootDir, 'README.md');

  fs.writeFileSync(readme, '# README');
  watcher.watcher?.emit('all', 'add', readme);
  fs.writeFileSync(readme, '# README changed');
  watcher.watcher?.emit('all', 'change', readme);

  const dir = await emitted;

  expect(dir.reading?.content).toMatch(/!!TEST!! # README/);
  await watcher.close();
});

it('test sort', async () => {
  const watcher = createWatcher({ root: dirAB });

  fs.mkdirSync(path.join(dirAB, '.a'));
  fs.mkdirSync(path.join(dirAB, '.b'));
  fs.mkdirSync(path.join(dirAB, 'a'));
  fs.writeFileSync(path.join(dirAB, '.a.md'), '');
  fs.writeFileSync(path.join(dirAB, 'a.md'), '');

  const emitted = new Promise<PenDirectoryData>((resolve) => {
    watcher.setupEmit((_, data) => resolve(data as PenDirectoryData));
  });

  await watcher.setupWatching('/');

  const dir = await emitted;

  expect(dir.children.map((c) => c.filename)).toEqual(['.a', '.b', 'a', '.a.md', 'a.md']);

  await watcher.close();
});
