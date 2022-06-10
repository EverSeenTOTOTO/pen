/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Watcher } from '@/server/watcher';
import { PenDirectoryData, PenErrorData, WatcherOptions } from '@/types';
import { logger } from '@/server/logger';
import path from 'path';
import fs from 'fs';
import chokidar from 'chokidar';
import {
  mdA, mdb, rootDir, MockChokidar, dirA, mockRemark,
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

const watchAndSend = (watcher: Watcher, relative: string) => watcher.setupWatching(relative)
  .then(() => watcher.sendData())
  .catch((e) => watcher.sendError(e));

it('test watcher', (done) => {
  const watcher = createWatcher();

  watchAndSend(watcher, '/')
    .finally(() => {
      expect(watcher.watcher).toBeInstanceOf(MockChokidar);
      expect(watcher.root).toBe(rootDir);
      watcher?.close()?.finally(done);
    });
});

it('test watch root', (done) => {
  const watcher = createWatcher();

  watcher.setupEmit((_, data) => {
    const dir = data as PenDirectoryData;

    expect(dir.relativePath).toBe('/');
    expect(dir.children.length).toBe(2);

    watcher.close()?.finally(done);
  });
  watchAndSend(watcher, '/');
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
  watchAndSend(watcher, '/');
});

it('test switchTo nested', (done) => {
  const watcher = createWatcher();
  const datas: any[] = [];

  watcher.setupEmit((_, data) => {
    datas.push(data);
  });

  watchAndSend(watcher, '/').finally(() => {
    watchAndSend(watcher, '/A/b.md').finally(() => {
      expect(datas[0].relativePath).toBe('/');
      expect(datas[1].relativePath).toBe('/A');
      expect(datas[1].reading).not.toBeUndefined();

      watcher.close()?.finally(done);
    });
  });
});

it('test change', (done) => {
  const watcher = createWatcher();

  watchAndSend(watcher, '/A/b.md').finally(() => {
    watcher.setupEmit((_, data) => {
      const dir = data as PenDirectoryData;

      expect(dir.reading?.content).toMatch(/!!TEST!! # change/);
      watcher.close()?.finally(done);
    });

    fs.writeFileSync(mdb, '# change');
    watcher.watcher?.emit('all', 'change', mdb);
  });
});

it('test addDir', (done) => {
  const watcher = createWatcher();

  watcher.setupEmit((_, data) => {
    const dir = data as PenDirectoryData;

    expect(dir.children.length).toBe(2);
  });

  watchAndSend(watcher, '/A/b.md').finally(() => {
    watcher.setupEmit((_, data) => {
      const dir = data as PenDirectoryData;

      expect(dir.children.length).toBe(3);
      watcher.close()?.finally(done);
    });

    const dir = path.join(dirA, 'dir');
    fs.mkdirSync(dir);
    watcher.watcher?.emit('all', 'addDir', dir);
  });
});

it('test rm watching', (done) => {
  const watcher = createWatcher();

  watcher.setupWatching('/A.md').finally(() => {
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

  watcher.setupWatching('/').then(() => {
    watcher.setupEmit((_, data) => {
      const dir = data as PenDirectoryData;

      expect(dir.reading?.content).toMatch(/!!TEST!! # README/);
      watcher.close()?.finally(done);
    });

    const readme = path.join(rootDir, 'README.md');

    fs.writeFileSync(readme, '# README');
    watcher.watcher?.emit('all', 'add', readme);
  });
});
