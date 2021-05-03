/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { resolve } from 'path';
import fs, { FSWatcher } from 'fs';
import { Socket } from 'socket.io';
import mdrender from './markdown';

export type PenLogger = {
  info: (...args: any[]) => void,
  warn: (...args: any[]) => void,
  error: (...args: any[]) => void,
  log: (...args: any[]) => void
};

export type MdContent = string | {
  filename?: string,
  type: 'markdown' | 'dir' | 'other'
}[];

interface PenWatcher {
  path: string,
  root: string,
  ignores?: RegExp|RegExp[],
  logger?: PenLogger,
  socket: Socket
}

const isDir = (filepath: string) => {
  const stat = fs.statSync(filepath);
  return stat.isDirectory();
};

export const isIgnored = (filepath: string, ignores?: PenWatcher['ignores']) => {
  if (ignores !== undefined) {
    if (Array.isArray(ignores)) {
      return ignores.filter((regex) => regex.test(filepath)).length > 0;
    }
    return ignores.test(filepath);
  }
  return false;
};

// check file permission
const checkPermission = (filepath: string, root:string, ignores?: PenWatcher['ignores']) => {
  if (!resolve(filepath).startsWith(resolve(root)) || !fs.existsSync(filepath)) {
    throw new Error(`Pen not permitted to watch: ${filepath}, or maybe file does not exits.`);
  }
  if (isIgnored(filepath, ignores)) {
    throw new Error(`${filepath} is ignored due to your config`);
  }
};

const readMarkdownFiles = (option: Pick<PenWatcher, 'path'|'root'|'ignores'>): Promise<MdContent> => {
  try {
    const { path, root, ignores } = option;

    checkPermission(path, root, ignores);

    if (isDir(path)) {
      return fs
        .promises
        .readdir(path)
        .then((files) => files
          .filter((filename: string) => {
            const fullpath = resolve(path, filename);
            return !isIgnored(fullpath, ignores);
          })
          .map((filename: string) => {
            if (/\.(md|markdown)$/.test(filename)) {
              return {
                filename, type: 'markdown',
              };
            }
            if (isDir(resolve(path, filename))) {
              return {
                filename, type: 'dir',
              };
            }
            return {
              type: 'other',
            };
          }));
    }
    // is md file
    return Promise.resolve(mdrender(fs.readFileSync(path).toString(), root));
  } catch (e) {
    return Promise.reject(e);
  }
};

export default class Watcher implements Omit<PenWatcher, 'socket'> {
  private watcher?: FSWatcher;

  root: string;

  path: string;

  ignores?: RegExp | RegExp[] | undefined;

  logger?: PenLogger | undefined;

  onerror: (e: Error) => void;

  ondir: (dirs: Exclude<MdContent, string>) => void;

  onfile: (content: string) => void;

  constructor(opts: PenWatcher) {
    this.path = opts.path;
    this.root = opts.root;
    this.ignores = opts.ignores;
    this.logger = opts.logger;

    const { socket } = opts;

    this.onerror = (e: Error) => {
      socket.emit('penerror', JSON.stringify(e.stack ?? e.message ?? 'internal pen error'));
    };
    this.ondir = (dirs: Exclude<MdContent, string>) => {
      socket.emit('pendir', JSON.stringify(dirs));
    };
    this.onfile = (content: string) => {
      socket.emit('penfile', JSON.stringify(content));
    };
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
        if (Array.isArray(content)) {
          this.ondir(content.filter((item) => item.type !== 'other' && item.filename));
        } else {
          this.onfile(content);
        }
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
