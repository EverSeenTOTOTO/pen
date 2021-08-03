/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { resolve, relative, basename } from 'path';
import fs, { FSWatcher } from 'fs';
import slash from 'slash';
import { Socket } from 'socket.io';
import mdrender from './markdown';
import * as logger from './logger';

type FileInfo = {
  filename: string,
  relative: string,
  type: string,
  current: boolean
};

export type MdContent = {
  files: FileInfo[],
  content: string
};

interface PenWatcher {
  path: string,
  root: string,
  ignores?: RegExp|RegExp[],
  logger?: typeof logger,
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
    throw new Error(`Pen ignored ${path} due to your config`);
  }
};

const readFiles = (option: Pick<PenWatcher, 'path'|'root'|'ignores'>): FileInfo[] => {
  const { path, root, ignores } = option;
  const files = fs.readdirSync(path);

  return files
    .filter((filename: string) => {
      const fullpath = resolve(path, filename);
      return !isIgnored(fullpath, ignores);
    })
    .map((filename: string) => {
      const filepath = resolve(path, filename);
      const relativePath = slash(relative(root, filepath));

      if (/\.(md|markdown)$/.test(filename)) {
        return {
          filename,
          relative: relativePath,
          type: 'markdown',
          current: false,
        };
      }
      if (isDir(filepath)) {
        return {
          filename,
          relative: relativePath,
          type: 'dir',
          current: false,
        };
      }
      return {
        filename: '',
        relative: '',
        type: 'other',
        current: false,
      };
    });
};

const sort = (a: FileInfo, b: FileInfo) => {
  if (a.filename < b.filename) {
    return -1;
  }
  return 0;
};

const readMarkdownFiles = (option: Pick<PenWatcher, 'path'|'root'|'ignores'>): MdContent => {
  checkPermission(option);

  const { root, path, ignores } = option;
  // 是一个md
  if (!isDir(option.path)) {
    const { files } = readMarkdownFiles({
      ...option,
      path: resolve(path, '..'),
    });

    for (const each of files) {
      if (basename(path) === basename(each.filename)) {
        each.current = true;
      } else {
        each.current = false;
      }
    }

    return {
      files,
      content: mdrender(fs.readFileSync(path).toString(), root),
    };
  }

  const files = readFiles({
    root,
    path,
    ignores,
  }).filter((each) => each.type !== 'other');

  return {
    files: files.sort(sort),
    content: '',
  };
};

export default class Watcher implements Omit<PenWatcher, 'socket'> {
  private watcher?: FSWatcher;

  root: string;

  path: string;

  ignores?: RegExp | RegExp[] | undefined;

  logger?: typeof logger | undefined;

  onerror: (e: Error) => void;

  ondata: (data: MdContent) => void;

  constructor(opts: PenWatcher) {
    this.path = opts.path;
    this.root = opts.root;
    this.ignores = opts.ignores;
    this.logger = opts.logger;

    const { socket } = opts;

    this.onerror = (e: Error) => {
      this.logger?.error(e.stack ?? e.message);
      socket.emit('penerror', mdrender(`
\`\`\`txt
${e.stack ?? e.message ?? 'internal pen server error'}
\`\`\`
`, this.root));
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
          this.logger?.info(`Pen detected ${basename(this.path)} -> ${event}`);

          this.trigger();
        },
      );

      watcher.on('error', this.onerror);

      this.watcher = watcher;
    } catch (e) {
      this.onerror(e);
    }

    return this;
  }

  trigger(): Watcher {
    try {
      const content = readMarkdownFiles({
        path: this.path,
        root: this.root,
        ignores: this.ignores,
      });
      this.ondata(content);
    } catch (e) {
      this.onerror(e);
    }
    return this;
  }

  stop(): Watcher {
    this.watcher?.close();
    return this;
  }
}
