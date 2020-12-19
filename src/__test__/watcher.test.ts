import path from 'path';
import fs from 'fs';
import Watcher from '../watcher';

describe('test wathcer', () => {
  const TMP_DIR = './tmp/';
  const md = path.resolve(TMP_DIR, './hello.md');
  const notMd = path.resolve(TMP_DIR, './hello.txt');

  beforeEach(() => {
    fs.mkdirSync(TMP_DIR);
    fs.mkdirSync(path.resolve(TMP_DIR, './sub/'));
    fs.writeFileSync(md, '# md');
    fs.writeFileSync(notMd, '# not md');
  });
  afterEach(() => {
    fs.rmdirSync(TMP_DIR, {
      recursive: true,
    });
  });

  it('test watch file, trigger', (done) => {
    const watcher = new Watcher({
      path: md,
      ondata: (data) => {
        expect(data).toMatch(/<h1 id="md">md<\/h1>/);
        watcher.stop();
        done();
      },
      onerror: () => {},
    });
    watcher.start();
    watcher.trigger();
  });

  it('watch file, modify', (done) => {
    const watcher = new Watcher({
      path: md,
      ondata: (data) => {
        expect(data).toMatch(/wow/);
        watcher.stop();
        done();
      },
      onerror: () => {},
    });
    watcher.start();
    fs.writeFileSync(md, '# wow');
  });

  it('watch file, delete', (done) => {
    const watcher = new Watcher({
      path: md,
      ondata: () => {},
      onerror: (e) => {
        expect(e.message).toMatch(/no such file or directory/);
        watcher.stop();
        done();
      },
    });
    watcher.start();
    fs.unlinkSync(md);
  });

  it('watch a no-md file', (done) => {
    const watcher = new Watcher({
      path: notMd,
      ondata: (data) => {
        expect(data).toMatch(/not md/);
        watcher.stop();
        done();
      },
      onerror: () => {},
    });
    watcher.start();
    watcher.trigger();
  });

  it('watch a dir, trigger', (done) => {
    const watcher = new Watcher({
      path: TMP_DIR,
      ondata: (data) => {
        expect(data).toEqual([
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
        done();
      },
      onerror: () => {},
    });
    watcher.start();
    watcher.trigger();
  });

  it('watch a dir, delete file', (done) => {
    const watcher = new Watcher({
      path: TMP_DIR,
      ondata: (data) => {
        expect(data).toEqual([
          {
            filename: 'sub',
            type: 'dir',
          },
        ]);
        watcher.stop();
        done();
      },
      onerror: () => {},
    });
    watcher.start();
    fs.unlinkSync(md);
  });
});
