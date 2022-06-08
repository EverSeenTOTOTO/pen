import { Watcher } from '@/server/watcher';
import { PenDirectoryData, PenErrorData, WatcherOptions } from '@/types';
import { logger } from '@/server/logger';
import path from 'path';
import fs from 'fs';
import {
  mdA, mdb, rootDir,
} from './setup';

const createWatcher = (opts?: Partial<WatcherOptions>) => new Watcher({
  logger,
  root: rootDir,
  ignores: [],
  ...opts,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  remark: { // FIXME: unified is a mjs module which cannot be required in vite dev
    render: {} as any,
    tocExtractor: {} as any,
    usePlugins() {},
    process: (s: string) => Promise.resolve({ content: `!!TEST!! ${s}` }),
    processError: (s?: Error) => Promise.resolve({ message: s?.message ?? '' }),
  },
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

it('test switchTo nested', (done) => {
  const watcher = createWatcher();

  watcher.setupEmit((_, data) => {
    const dir = data as PenDirectoryData;

    expect(dir.relativePath).toBe('/');
  });

  watcher.setupWatching('/').then(() => {
    watcher.setupEmit((_, data) => {
      const dir = data as PenDirectoryData;

      expect(dir.relativePath).toBe('/A');
      expect(dir.reading).not.toBeUndefined();

      watcher.close()?.finally(done);
    });
    watcher.setupWatching('/A/b.md');
  });
});

it('test change', (done) => {
  const watcher = createWatcher();

  watcher.setupEmit((_, data) => {
    const dir = data as PenDirectoryData;

    expect(dir.reading).not.toBeUndefined();
  });
  watcher.setupWatching('/A/b.md').then(() => {
    watcher.setupEmit((_, data) => {
      const dir = data as PenDirectoryData;

      expect(dir.reading?.content).toMatch(/!!TEST!! # change/);
      watcher.close()?.finally(done);
    });

    fs.writeFileSync(mdb, '# change');
  });
});

it('test rm watching', (done) => {
  const watcher = createWatcher();

  watcher.setupEmit((_, data) => {
    const dir = data as PenDirectoryData;

    expect(dir.reading).not.toBeUndefined();
  });

  watcher.setupWatching('/A.md').then(() => {
    watcher.setupEmit((_, data) => {
      const err = data as PenErrorData;

      expect(err.message).toMatch(/no such file or directory/i);
      watcher.close()?.finally(done);
    });

    fs.rmSync(mdA);
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

    fs.writeFileSync(path.join(rootDir, 'README.md'), '# README');
  });
});
