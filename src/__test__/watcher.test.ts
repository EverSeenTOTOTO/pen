import path from 'path';
import fs from 'fs';
import Watcher from '../watcher';

const TMP_DIR = './tmp';
const md = path.resolve(TMP_DIR, './hello.md');
const notMd = path.resolve(TMP_DIR, './hello.txt');

beforeEach(() => {
  fs.mkdirSync(TMP_DIR);
  fs.mkdirSync(path.resolve(TMP_DIR, './sub'));
  fs.writeFileSync(md, '# md');
  fs.writeFileSync(notMd, '# not md');
});
afterEach(() => {
  fs.rmdirSync(TMP_DIR, {
    recursive: true,
  });
});

describe('test wathcer', () => {
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
    watcher.trigger();
  });

  it('test watch file, modify', (done) => {
    const watcher = new Watcher({
      path: md,
      ondata: (data) => {
        expect(data).toMatch(/wow/);
        watcher.stop();
        done();
      },
      onerror: () => {},
    });
    fs.writeFileSync(md, '# wow');
    expect(fs.readFileSync(md).toString()).toMatch(/# wow/);
  });

  it('test watch file, delete', (done) => {
    const watcher = new Watcher({
      path: md,
      ondata: () => {},
      onerror: (e) => {
        console.info(e.message);
        expect(e.message).toMatch(/file/);
        watcher.stop();
        done();
      },
    });
    fs.unlinkSync(md);
  });

  it('test watch not a md file', (done) => {
    const watcher = new Watcher({
      path: notMd,
      ondata: (data) => {
        expect(data).toMatch(/not md/);
        watcher.stop();
        done();
      },
      onerror: () => {},
    });
    watcher.trigger();
  });

  it('test watch a dir, trigger', (done) => {
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
    watcher.trigger();
  });

  it('test watch a dir, delete', (done) => {
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
    fs.unlinkSync(md);
  });
});
