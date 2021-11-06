import fs, { FSWatcher } from 'fs';
import {
  basename, dirname, extname, relative, resolve,
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
};

export type MdContent = {
  files: FileInfo[],
  content: string,
  current: string
  type: 'markdown' | 'dir'
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
    throw new Error(`Opps, pen not permitted to watch this file, or maybe file not exist: ${path}?`);
  }

  if (ignores !== undefined) {
    if (Array.isArray(ignores)) {
      return ignores.filter((regex) => regex.test(path)).length === 0;
    }
    return !ignores.test(path);
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
      const content = this.readMarkdownFiles(this.path);

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

  readMarkdownFiles(path: string): MdContent {
    let current = '';

    // 是一个md
    if (!isDir(path)) {
      const { files } = this.readMarkdownFiles(dirname(this.path));

      for (const each of files) {
        if (basename(path) === basename(each.filename)
         && extname(each.filename) === extname(path)) {
          current = each.filename;
        }
      }

      return {
        files,
        content: this.render(fs.readFileSync(path).toString()),
        current,
        type: 'markdown',
      };
    }

    const stats = fs.statSync(path);
    const files = this.readFiles(path).filter((each) => each.type !== 'other');

    return {
      files: files.sort((a: FileInfo, b: FileInfo) => {
        if (a.filename < b.filename) {
          return -1;
        }
        return 0;
      }),
      content: this.render(`
::: Info

### ${basename(path)} 

+ **创建于:** ${stats.ctime}.
+ **最后修改于:** ${stats.mtime}
:::
`),
      current,
      type: 'dir',
    };
  }

  readFiles(path: string) {
    const files = fs.readdirSync(path);

    return files
      .filter((filename: string) => {
        return checkPermission({
          path: resolve(path, filename),
          root: this.root,
          ignores: this.ignores,
        });
      })
      .map((filename: string) => {
        const filepath = resolve(path, filename);
        const relativePath = slash(relative(this.root, filepath));

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
      });
  }
}
