/* eslint-disable @typescript-eslint/ban-ts-comment */
import { SimpleQueue, Watcher } from '@/server/watcher';
import { PenDirectoryData, PenErrorData, WatcherOptions } from '@/types';
import { logger } from '@/server/logger';
import path from 'path';
import fs from 'fs';
import chokidar from 'chokidar';
import {
  mdA, mdb, rootDir, MockChokidar, dirA, mockRemark, dirAB,
} from './setup';

jest.mock('chokidar');
// @ts-ignore
jest.spyOn(chokidar, 'watch').mockImplementation((root: string, options: unknown) => new MockChokidar(root, options));

const createWatcher = (opts?: Partial<WatcherOptions>) => new Watcher({
  logger,
  root: rootDir,
  ignores: [],
  ...opts,
  // @ts-ignore
  remark: mockRemark,
});

const sleep = (timeout: number) => new Promise<void>((res) => setTimeout(res, timeout));

it('test schedule', async () => {
  const mockWatcher = {
    jump: jest.fn(),
    refresh: jest.fn(),
    sendData: jest.fn(),
    sendError: jest.fn(),
    clear() {
      this.jump.mockClear();
      this.refresh.mockClear();
      this.sendData.mockClear();
      this.sendError.mockClear();
    },
  };
  // @ts-ignore
  const queue = new SimpleQueue(mockWatcher);

  queue.enque({ type: 'jump', relative: '/' });
  queue.enque({ type: 'jump', relative: '/a' });
  queue.enque({ type: 'jump', relative: '/b' });
  queue.enque({ type: 'jump', relative: '/c' });
  await sleep(400);
  expect(mockWatcher.jump).toHaveBeenCalledTimes(1);
  expect(mockWatcher.jump).toHaveBeenNthCalledWith(1, '/c');
  mockWatcher.clear();

  queue.enque({ type: 'refresh', relative: '/' });
  queue.enque({ type: 'refresh', relative: '/' });
  queue.enque({ type: 'refresh', relative: '/' });
  await sleep(400);
  expect(mockWatcher.refresh).toHaveBeenCalledTimes(1);
  expect(mockWatcher.refresh).toHaveBeenCalledWith('/');
  mockWatcher.clear();

  queue.enque({ type: 'jump', relative: '/' });
  queue.enque({ type: 'refresh', relative: '/' });
  queue.enque({ type: 'refresh', relative: '/' });
  queue.enque({ type: 'refresh', relative: '/' });
  await sleep(700);
  expect(mockWatcher.jump).toHaveBeenCalledTimes(1);
  expect(mockWatcher.refresh).toHaveBeenCalledTimes(1);
  mockWatcher.clear();

  queue.enque({ type: 'refresh', relative: '/' });
  queue.enque({ type: 'jump', relative: '/' });
  queue.enque({ type: 'jump', relative: '/' });
  queue.enque({ type: 'jump', relative: '/' });
  await sleep(400);
  expect(mockWatcher.jump).toHaveBeenCalledTimes(1);
  expect(mockWatcher.refresh).not.toHaveBeenCalled();
});

it('test watcher', (done) => {
  const watcher = createWatcher();

  watcher.setupWatching('/');
  setTimeout(() => {
    expect(watcher.watcher).toBeInstanceOf(MockChokidar);
    expect(watcher.root).toBe(rootDir);
    watcher?.close()?.finally(done);
  }, 400);
});

it('test watch root', (done) => {
  const watcher = createWatcher();

  watcher.setupEmit((_, data) => {
    const dir = data as PenDirectoryData;

    expect(dir.relativePath).toBe('/');
    expect(dir.children.length).toBe(2);

    watcher.close()?.finally(done);
  });
  watcher.setupWatching('/');
});

it('test ignores', (done) => {
  const watcher = createWatcher({
    ignores: [/A/],
  });

  watcher.setupEmit((_, data) => {
    const dir = data as PenDirectoryData;

    expect(dir.children.length).toBe(0);
    watcher.close()?.finally(done);
  });
  watcher.setupWatching('/');
});

it('test jumpTo nested', (done) => {
  const watcher = createWatcher();
  const datas: any[] = [];

  watcher.setupEmit((_, data) => {
    datas.push(data);
  });

  watcher.setupWatching('/');
  setTimeout(() => {
    watcher.setupWatching('/A/b.md');
    setTimeout(() => {
      expect(datas[0].relativePath).toBe('/');
      expect(datas[1].relativePath).toBe('/A');
      expect(datas[1].reading).not.toBeUndefined();

      watcher.close()?.finally(done);
    }, 400);
  }, 400);
});

it('test change', (done) => {
  const watcher = createWatcher();

  watcher.setupWatching('/A/b.md');
  setTimeout(() => {
    watcher.setupEmit((_, data) => {
      const dir = data as PenDirectoryData;

      expect(dir.reading?.content).toMatch(/!!TEST!! # change/);
      watcher.close()?.finally(done);
    });

    fs.writeFileSync(mdb, '# change');
    watcher.watcher?.emit('all', 'change', mdb);
  }, 400);
});

it('test addDir', (done) => {
  const watcher = createWatcher();

  watcher.setupEmit((_, data) => {
    const dir = data as PenDirectoryData;

    expect(dir.children.length).toBe(2);
  });

  watcher.setupWatching('/A/b.md');
  setTimeout(() => {
    watcher.setupEmit((_, data) => {
      const dir = data as PenDirectoryData;

      expect(dir.children.length).toBe(3);
      watcher.close()?.finally(done);
    });

    const dir = path.join(dirA, 'dir');
    fs.mkdirSync(dir);
    watcher.watcher?.emit('all', 'addDir', dir);
  }, 400);
});

it('test rm watching', (done) => {
  const watcher = createWatcher();

  watcher.setupWatching('/A.md');
  setTimeout(() => {
    watcher.setupEmit((_, data) => {
      const err = data as PenErrorData;

      expect(err.message).toMatch(/no such file or directory/);
      watcher.close()?.finally(done);
    });

    fs.rmSync(mdA);
    watcher.watcher?.emit('all', 'unlink', mdA);
  });
});

it('test add readme', (done) => {
  const watcher = createWatcher();

  watcher.setupWatching('/');
  setTimeout(() => {
    watcher.setupEmit((_, data) => {
      const dir = data as PenDirectoryData;

      expect(dir.reading?.content).toMatch(/!!TEST!! # README/);
      watcher.close()?.finally(done);
    });

    const readme = path.join(rootDir, 'README.md');

    fs.writeFileSync(readme, '# README');
    watcher.watcher?.emit('all', 'add', readme);
  }, 400);
});

it('test sort', (done) => {
  const watcher = createWatcher({ root: dirAB });

  fs.mkdirSync(path.join(dirAB, '.a'));
  fs.mkdirSync(path.join(dirAB, '.b'));
  fs.mkdirSync(path.join(dirAB, 'a'));
  fs.writeFileSync(path.join(dirAB, '.a.md'), '');
  fs.writeFileSync(path.join(dirAB, 'a.md'), '');

  watcher.setupEmit((_, data) => {
    const dir = data as PenDirectoryData;

    expect(dir.children.map((c) => c.filename)).toEqual(['.a', '.b', 'a', '.a.md', 'a.md']);

    watcher.close()?.finally(done);
  });
  watcher.setupWatching('/');
});
