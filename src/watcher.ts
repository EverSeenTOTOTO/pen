import fs, { FSWatcher } from 'fs';
import {
  basename, extname, relative, resolve,
} from 'path';
import { Socket } from 'socket.io';
import * as logger from './logger';
import createRender from './markdown';

function slash(path: string) {
  const isExtendedLengthPath = /^\\\\\?\\/.test(path);
  const hasNonAscii = /[^\u0000-\u0080]+/.test(path); // eslint-disable-line no-control-regex

  if (isExtendedLengthPath || hasNonAscii) {
    return path;
  }

  return path.replace(/\\/g, '/');
}

type FileInfo = {
  filename: string,
  relative: string,
  type: string,
  current: boolean
};

export type MdContent = {
  files: FileInfo[],
  content: string,
  current: string
};

interface PenWatcher {
  path: string,
  root: string,
  ignores?: RegExp|RegExp[],
  logger?: typeof logger,
  socket: Socket
  render: ReturnType<typeof createRender>
}

const isDir = (filepath: string) => {
  const stat = fs.statSync(filepath);
  return stat.isDirectory();
};

// check file permission
const checkPermission = (option: Pick<PenWatcher, 'path'|'root'|'ignores'>) => {
  const { path, root, ignores } = option;

  if (!resolve(path).startsWith(resolve(root)) || !fs.existsSync(path)) {
    throw new Error(`Opps, pen not permitted to watch this file, or maybe file not exist? ${path}`);
  }

  if (ignores !== undefined) {
    if (Array.isArray(ignores)) {
      return ignores.filter((regex) => regex.test(path)).length > 0;
    }
    return ignores.test(path);
  }

  return true;
};

export default class Watcher implements PenWatcher {
  private watcher?: FSWatcher;

  root: string;

  path: string;

  ignores?: RegExp | RegExp[] | undefined;

  logger?: typeof logger | undefined;

  render: PenWatcher['render'];

  socket: PenWatcher['socket'];

  onerror: (e: Error) => void;

  ondata: (data: MdContent) => void;

  constructor(opts: PenWatcher) {
    this.path = opts.path;
    this.root = opts.root;
    this.ignores = opts.ignores;
    this.logger = opts.logger;
    this.render = opts.render;
    this.socket = opts.socket;

    this.onerror = (e: Error) => {
      this.logger?.error(e.stack ?? e.message);
      this.socket.emit('penerror', this.render(`
\`\`\`txt
${e.stack ?? e.message ?? 'internal pen server error'}
\`\`\`
`));
    };
    this.ondata = (data: MdContent) => {
      this.socket.emit('pendata', JSON.stringify(data));
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
      this.onerror(e as Error);
    }

    return this;
  }

  trigger(): Watcher {
    try {
      const content = this.readMarkdownFiles();
      this.ondata(content);
    } catch (e) {
      this.onerror(e as Error);
    }
    return this;
  }

  stop(): Watcher {
    this.watcher?.close();
    return this;
  }

  readMarkdownFiles(): MdContent {
    let current = '';

    // 是一个md
    if (!isDir(this.path)) {
      const { files } = this.readMarkdownFiles();

      for (const each of files) {
        if (basename(this.path) === basename(each.filename)
         && extname(each.filename) === extname(this.path)) {
          current = each.filename;
        }
      }

      return {
        files,
        content: this.render(fs.readFileSync(this.path).toString()),
        current,
      };
    }

    const files = this.readFiles().filter((each) => each.type !== 'other');

    return {
      files: files.sort((a: FileInfo, b: FileInfo) => {
        if (a.filename < b.filename) {
          return -1;
        }
        return 0;
      }),
      content: '',
      current,
    };
  }

  readFiles() {
    const files = fs.readdirSync(this.path);

    return files
      .filter((filename: string) => {
        return checkPermission({
          path: resolve(this.path, filename),
          root: this.root,
          ignores: this.ignores,
        });
      })
      .map((filename: string) => {
        const filepath = resolve(this.path, filename);
        const relativePath = slash(relative(this.root, filepath));

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
  }
}
