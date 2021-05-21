/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { resolve, relative } from 'path';
import fs, { FSWatcher } from 'fs';
import { Socket } from 'socket.io';
import mdrender from './markdown';

export type PenLogger = {
  info: (...args: any[]) => void,
  warn: (...args: any[]) => void,
  error: (...args: any[]) => void,
  log: (...args: any[]) => void
};

export type MdContent = {
  dirs: {
    filename: string,
    relative: string,
    type: string
  }[],
  content: string
};

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
const checkPermission = (option: Pick<PenWatcher, 'path'|'root'|'ignores'>) => {
  const { path, root, ignores } = option;
  if (!resolve(path).startsWith(resolve(root)) || !fs.existsSync(path)) {
    throw new Error(`Pen not permitted to watch: ${path}, or maybe file does not exits.`);
  }
  if (isIgnored(path, ignores)) {
    throw new Error(`${path} is ignored due to your config`);
  }
};

const readDirs = (option: Pick<PenWatcher, 'path'|'root'|'ignores'>) => {
  const { path, root, ignores } = option;
  return fs
    .promises
    .readdir(path)
    .then((files) => files
      .filter((filename: string) => {
        const fullpath = resolve(path, filename);
        return !isIgnored(fullpath, ignores);
      })
      .map((filename: string) => {
        const filepath = resolve(path, filename);
        const relativePath = relative(root, filepath);

        if (/\.(md|markdown)$/.test(filename)) {
          return {
            filename,
            relative: relativePath,
            type: 'markdown',
          };
        }
        if (isDir(filepath)) {
          return {
            filename,
            relative: relativePath,
            type: 'dir',
          };
        }
        return {
          filename: '',
          relative: '',
          type: 'other',
        };
      }));
};

const readMarkdownFiles = async (option: Pick<PenWatcher, 'path'|'root'|'ignores'>): Promise<MdContent> => {
  try {
    const { path, root } = option;

    checkPermission(option);

    if (isDir(path)) {
      const dirs = await readDirs(option);

      return {
        dirs: dirs.filter((each) => each.type !== 'other'),
        content: '',
      };
    }

    // is md file
    const parent = resolve(path, '..');
    const dirs = await readDirs({
      ...option,
      path: parent,
    });
    return {
      dirs: dirs.filter((each) => each.type !== 'other'),
      content: mdrender(fs.readFileSync(path).toString(), root),
    };
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

  ondata: (data: MdContent) => void;

  constructor(opts: PenWatcher) {
    this.path = opts.path;
    this.root = opts.root;
    this.ignores = opts.ignores;
    this.logger = opts.logger;

    const { socket } = opts;

    this.onerror = (e: Error) => {
      socket.emit('penerror', JSON.stringify(e.stack ?? e.message ?? 'internal pen error'));
    };
    this.ondata = (data: MdContent) => {
      socket.emit('pendata', JSON.stringify(data));
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
        this.ondata(content);
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
