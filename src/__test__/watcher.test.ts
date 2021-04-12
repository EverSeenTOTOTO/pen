import path from 'path';
import fs from 'fs';
import Watcher from '../watcher';

describe('test wathcer', () => {
  const root = '.';
  const TMP_DIR = path.resolve(root, 'tmp2');
  const md = path.resolve(TMP_DIR, './hello.md');
  const notMd = path.resolve(TMP_DIR, './hello.txt');

  beforeAll(() => {
    fs.mkdirSync(TMP_DIR);
    fs.mkdirSync(path.resolve(TMP_DIR, './sub/'));
    fs.writeFileSync(md, '# md');
    fs.writeFileSync(notMd, '# not md');
  });
  afterAll(() => {
    fs.rmdirSync(TMP_DIR, {
      recursive: true,
    });
  });

  it('test watch file, trigger', () => new Promise<void>((res, rej) => {
    const watcher = new Watcher({
      path: md,
      ondata: (data) => {
        expect(JSON.parse(data)).toMatch(/<h1 id="md">md<\/h1>/);
        watcher.stop();
        res();
      },
      onerror: () => {
        watcher.stop();
        rej();
      },
    });
    watcher.start();
    watcher.trigger();
  }));

  it('watch file, modify', () => new Promise<void>((res, rej) => {
    const watcher = new Watcher({
      path: md,
      ondata: (data) => {
        expect(JSON.parse(data)).toMatch(/wow/);
        watcher.stop();
        res();
      },
      onerror: () => {
        watcher.stop();
        rej();
      },
    });
    watcher.start();
    fs.writeFileSync(md, '# wow');
  }));

  it('watch file, delete', () => new Promise<void>((res, rej) => {
    const watcher = new Watcher({
      path: md,
      ondata: () => {
        watcher.stop();
        rej();
      },
      onerror: (e) => {
        expect(e.message).toMatch(/no such file or directory/);
        watcher.stop();
        res();
      },
    });
    watcher.start();
    fs.unlinkSync(md);
  }));

  it('watch a no-md file', () => new Promise<void>((res, rej) => {
    const watcher = new Watcher({
      path: notMd,
      ondata: (data) => {
        expect(JSON.parse(data)).toMatch(/not md/);
        watcher.stop();
        res();
      },
      onerror: () => {
        watcher.stop();
        rej();
      },
    });
    watcher.start();
    watcher.trigger();
  }));

  it('watch a dir, trigger', () => new Promise<void>((res, rej) => {
    fs.writeFileSync(md, '# md'); // rebuild file
    const watcher = new Watcher({
      path: TMP_DIR,
      ondata: (data) => {
        expect(JSON.parse(data)).toEqual([
          {
            filename: path.basename(md),
            type: 'markdown',
          },
          {
            filename: 'sub',
            type: 'dir',
          },
        ]);
        watcher.stop();
        res();
      },
      onerror: () => {
        watcher.stop();
        rej();
      },
    });
    watcher.start();
    watcher.trigger();
  }));

  it('watch a dir, delete file', () => new Promise<void>((res, rej) => {
    const watcher = new Watcher({
      path: TMP_DIR,
      ondata: (data) => {
        expect(JSON.parse(data)).toEqual([
          {
            filename: 'sub',
            type: 'dir',
          },
        ]);
        watcher.stop();
        res();
      },
      onerror: () => {
        watcher.stop();
        rej();
      },
    });
    watcher.start();
    fs.unlinkSync(md);
  }));
});
