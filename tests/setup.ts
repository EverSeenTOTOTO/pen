import { slash } from '@/utils';
import EventEmitter from 'events';
import fs, { mkdirSync } from 'fs';
import path from 'path';
import { cache } from '@/server/reader';

jest.setTimeout(20000);

beforeEach(() => cache.clear());

export const mockRemark = {
  render: {} as any,
  tocExtractor: {} as any,
  usePlugins() { },
  process: (s: string) => Promise.resolve({ content: `!!TEST!! ${s}` }),
  processError: (s?: Error) => Promise.resolve({ message: s?.message ?? '' }),
};

export class MockChokidar extends EventEmitter {
  root: string;

  options: unknown;

  constructor(root: string, options: unknown) {
    super();
    this.root = root;
    this.options = options;
  }

  on(evt: string, callback: (...args: unknown[]) => void) {
    super.on(evt, callback);

    if (evt === 'ready') {
      this.emit('ready');
    }
    return this;
  }

  // eslint-disable-next-line class-methods-use-this
  close() {
    return Promise.resolve();
  }
}

export const dist = path.resolve(__dirname, '../dist');

/**
  * - temp/
  *   - A/
  *     - B/
  *     - b.md
  *   - a.md
  *   - a.txt
  * */
export const rootDir = slash(path.resolve(__dirname, 'temp'));
export const dirA = path.join(rootDir, 'A');
export const dirAB = path.join(dirA, 'B');
export const mdA = path.join(rootDir, 'A.md');
export const txtA = path.join(rootDir, 'A.txt');
export const mdb = path.join(dirA, 'b.md');

beforeAll(async () => {
  if (fs.existsSync(rootDir)) {
    fs.rmSync(rootDir, { force: true, recursive: true });
  }
  mkdirSync(rootDir);
  mkdirSync(dirA);
  mkdirSync(dirAB);
  fs.writeFileSync(mdA, '# A');
  fs.writeFileSync(txtA, '# A');
  fs.writeFileSync(mdb, '# b');
});

afterAll(async () => {
  fs.rmSync(rootDir, { force: true, recursive: true });
});
