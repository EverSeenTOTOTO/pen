import chokidar from 'chokidar';
// eslint-disable-next-line import/no-extraneous-dependencies
import sort from 'alphanum-sort';
import chalk from 'chalk';
import fs from 'fs';
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

export type FileType = 'markdown' | 'dir' | 'pdf' | 'other';

export type FileInfo = {
  filename: string,
  relative: string,
  type: FileType,
};

export type MdContent = {
  files: FileInfo[],
  content: string,
  current: string
  type: FileType
};

interface PenWatcher {
  path: string,
  root: string,
  filetypes: RegExp,
  ignores: RegExp[],
  socket: Socket
  render: ReturnType<typeof createRender>
  logger?: typeof logger,
}

const isDir = (filepath: string) => {
  const stat = fs.statSync(filepath);
  return stat.isDirectory();
};

const getFileType = (filename: string): FileType => {
  return /\.(md|markdown)$/.test(filename)
    ? 'markdown'
    : /\.pdf$/.test(filename)
      ? 'pdf'
      : 'other';
};

const checkPermission = (option: Pick<PenWatcher, 'path'|'root'|'filetypes'|'ignores'>) => {
  const {
    path, root, filetypes, ignores,
  } = option;

  if (!resolve(path).startsWith(resolve(root)) || !fs.existsSync(path)) {
    throw new Error(`Opps, pen not permitted to watch this file, or maybe file not exist: ${path}?`);
  }

  return (isDir(path) || filetypes.test(path)) && ignores.filter((regex) => regex.test(path)).length === 0;
};

export default class Watcher implements PenWatcher {
  private watcher?: chokidar.FSWatcher;

  root: string;

  path: string;

  filetypes: RegExp;

  ignores: RegExp[];

  logger?: typeof logger;

  render: PenWatcher['render'];

  socket: PenWatcher['socket'];

  onerror: (e: Error) => void;

  ondata: (data: MdContent) => void;

  constructor(opts: PenWatcher) {
    this.path = opts.path;
    this.root = opts.root;
    this.filetypes = opts.filetypes;
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
      const watcher = chokidar.watch(
        this.path,
        {
          depth: 1,
          ignored: this.ignores,
        },
      );

      watcher.on('change', (path) => {
        if (path === this.path) {
          this.logger?.info(`Pen detected change on ${chalk.green(chalk.bold(path))}`);
          this.trigger();
        }
      });
      watcher.on('error', this.onerror);

      this.watcher = watcher;
    } catch (e) {
      this.onerror(e as Error);
    }

    return this;
  }

  trigger(): Watcher {
    try {
      const content = this.readContent(this.path);

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

  renderContent(path: string, type: FileType): string {
    if (type === 'pdf') {
      return slash(relative(this.root, path));
    }
    return this.render(fs.readFileSync(path, 'utf8').toString());
  }

  // 读取正文内容
  readContent(path: string): MdContent {
    let current = '';

    // 是一个文件
    if (!isDir(path)) {
      const { files } = this.readContent(dirname(this.path));

      for (const each of files) {
        if (basename(path) === basename(each.filename)
         && extname(each.filename) === extname(path)) {
          current = each.filename;
        }
      }

      const type = getFileType(path);

      return {
        files,
        content: this.renderContent(path, type),
        current,
        type,
      };
    }

    const stats = fs.statSync(path);
    const files = this.readFiles(path).filter((each) => each.type !== 'other');
    // looooooooop
    const dirCount = files.filter((each) => each.type === 'dir').length;
    const fileCount = files.filter((each) => each.type === 'markdown').length;
    const pdfCount = files.filter((each) => each.type === 'pdf').length;

    const dirInfo = dirCount > 0 ? `+ **子目录数量:** ${dirCount}` : '';
    const markdownInfo = fileCount > 0 ? `+ **Markdown 文档数量:** ${fileCount}` : '';
    const pdfInfo = pdfCount > 0 ? `+ **PDF 文档数量:** ${pdfCount}` : '';
    const sortInfo = sort(files.map((each) => each.relative.toLowerCase()));

    return {
      files: files.sort((a: FileInfo, b: FileInfo) => {
        if (sortInfo.indexOf(a.relative.toLowerCase()) < sortInfo.indexOf(b.relative.toLowerCase())) {
          return -1;
        }
        return 0;
      }),
      content: this.render(`
::: Info

### ${basename(path)} 

${dirInfo}
${pdfInfo}
${markdownInfo}
+ **创建于:** ${stats.ctime}
+ **最后修改于:** ${stats.mtime}
:::
`),
      current,
      type: 'dir',
    };
  }

  // 读取侧边栏目录：如果当前是文件，读取同级；如果是目录，读取子级
  readFiles(path: string): FileInfo[] {
    const files = fs.readdirSync(path);

    return files
      .filter((filename: string) => {
        return checkPermission({
          path: resolve(path, filename),
          root: this.root,
          filetypes: this.filetypes,
          ignores: this.ignores,
        });
      })
      .map((filename: string) => {
        const filepath = resolve(path, filename);
        const relativePath = slash(relative(this.root, filepath));

        if (isDir(filepath)) {
          return {
            filename,
            relative: relativePath,
            type: 'dir',
          };
        }

        return {
          filename,
          relative: relativePath,
          type: getFileType(filename),
        };
      });
  }
}
