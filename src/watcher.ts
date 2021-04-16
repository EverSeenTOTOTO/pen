import { resolve } from 'path';
import fs, { FSWatcher } from 'fs';
import slash from 'slash';
import mdrender from './markdown';

export type PenLogger = {
  info: (...args: any[]) => void,
  warn: (...args: any[]) => void,
  error: (...args: any[]) => void,
  log: (...args: any[]) => void
};

export type MdContent = string | {
  filename?: string,
  directory?: string,
  type: 'markdown' | 'dir' | 'other'
}[];

interface PenWatcher {
  path: string,
  root: string,
  ignores?: RegExp|RegExp[],
  logger?: PenLogger,
  ondata: (data: string) => void,
  onerror: (e: Error) => void
}

const isDir = (filepath: string) => {
  const stat = fs.statSync(filepath);
  return stat.isDirectory();
};

const ensureSlash = (directory: string) => {
  let dir = slash(directory);

  if (dir.startsWith('/')) {
    dir = `.${dir}`;
  } else {
    dir = `./${dir}`;
  }

  if (!dir.endsWith('/')) {
    dir = `${dir}/`;
  }

  return dir;
};

export const isIgnored = (filepath: string, ignores?: PenWatcher['ignores']):boolean => {
  if (ignores !== undefined) {
    if (Array.isArray(ignores)) {
      return ignores.filter((regex) => regex.test(filepath)).length > 0;
    }
    return ignores.test(filepath);
  }
  return false;
};

const readMarkdownFiles = (option: Pick<PenWatcher, 'path'|'root'|'ignores'>): Promise<MdContent> => {
  try {
    const { path, root, ignores } = option;
    const dir = resolve(path).replace(resolve(root), '');
    if (isDir(path)) {
      return fs.promises.readdir(path).then((files) => files
        .filter((filename: string) => {
          const fullpath = resolve(path, filename);
          return !isIgnored(fullpath, ignores);
        })
        .map((filename: string) => {
          if (/^[^.].*.(md|markdown)$/.test(filename)) {
            return {
              filename, type: 'markdown', directory: ensureSlash(dir),
            };
          }
          if (isDir(resolve(path, filename))) {
            return {
              filename, type: 'dir', directory: ensureSlash(dir),
            };
          }
          return {
            type: 'other',
          };
        }));
    }
    return Promise.resolve(mdrender(fs.readFileSync(path).toString(), path));
  } catch (e) {
    return Promise.reject(e);
  }
};

const handleData = (content: MdContent) => {
  let data = '';
  if (Array.isArray(content)) {
    data = JSON.stringify(content.filter((item) => item.type !== 'other' && item.filename));
  } else {
    data = JSON.stringify(content);
  }
  return data;
};

export default class Watcher implements PenWatcher {
  private watcher?: FSWatcher;

  root: string;

  path: string;

  ignores?: RegExp | RegExp[] | undefined;

  logger?: PenLogger | undefined;

  ondata: (data: string) => void;

  onerror: (e: Error) => void;

  constructor(opts: PenWatcher) {
    this.path = opts.path;
    this.root = opts.root;
    this.ignores = opts.ignores;
    this.logger = opts.logger;
    this.ondata = opts.ondata;
    this.onerror = opts.onerror;
  }

  start(): Watcher {
    this.stop();
    try {
      const watcher = fs.watch(
        this.path,
        {
          recursive: false,
        },
        (event) => {
          this.logger?.info(`${this.path} -> ${event}`);

          if (event === 'change') {
            this.trigger();
          } else if (event === 'rename') {
            if (!isDir(this.path)) {
              this.onerror(new Error(`no such file or directory: ${this.path}`));
            } else {
              this.trigger();
            }
          }
        },
      );

      watcher.on('error', this.onerror);

      this.watcher = watcher;
    } catch (e) {
      this.logger?.error(e);
      this.onerror(e);
    }

    return this;
  }

  trigger(): Watcher {
    readMarkdownFiles({
      path: this.path,
      root: this.root,
      ignores: this.ignores,
    })
      .then((content) => {
        this.ondata(handleData(content));
      })
      .catch((e) => {
        this.logger?.error(e);
        this.onerror(e);
      });
    return this;
  }

  stop(): Watcher {
    this.watcher?.close();
    return this;
  }
}
