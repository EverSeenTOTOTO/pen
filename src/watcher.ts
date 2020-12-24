import { resolve } from 'path';
import fs, { FSWatcher } from 'fs';
import mdrender from './markdown';

export type MdContent = string | {
  filename?: string,
  type: 'markdown' | 'dir' | 'other'
}[];

type WatcherOptions = {
  root: string,
  path: string,
  ondata: (content: MdContent) => void,
  onerror: (e: Error) => void
};

const isDir = (filepath: string) => {
  const stat = fs.statSync(filepath);
  return stat.isDirectory();
};
const readMarkdownFiles = (path: string): Promise<MdContent> => {
  try {
    if (isDir(path)) {
      return fs.promises.readdir(path).then((files) => files.map((filename: string) => {
        if (/^[^.].*.(md|markdown)$/.test(filename)) {
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
    return Promise.resolve(mdrender(fs.readFileSync(path).toString()));
  } catch (e) {
    return Promise.reject(e);
  }
};

export default class Watcher {
  private readonly options: WatcherOptions;

  private watcher?: FSWatcher;

  constructor(opts: WatcherOptions) {
    this.options = opts;
  }

  get path():string {
    return this.options.path;
  }

  start(): Watcher {
    this.stop();
    try {
      const watcher = fs.watch(
        this.options.path,
        {
          recursive: false,
        },
        (event) => {
          if (event === 'change') {
            this.trigger();
          } else if (event === 'rename') {
            if (!isDir(this.options.path)) {
              this.options.onerror(new Error(`no such file or directory: ${this.options.path}`));
            } else {
              this.trigger();
            }
          }
        },
      );
      watcher.on('error', this.options.onerror);

      this.watcher = watcher;
    } catch (e) {
      this.options.onerror(e);
    }

    return this;
  }

  trigger(): Watcher {
    readMarkdownFiles(this.options.path)
      .then((content) => {
        if (typeof content !== 'string') {
          // 如果不是根目录，添加“..”返回上一页
          if (resolve(this.options.path) !== resolve(this.options.root)) {
            content.unshift({
              type: 'dir',
              filename: '..',
            });
          }
          this.options.ondata(content.filter(({ type }) => type !== 'other'));
        } else {
          this.options.ondata(content);
        }
      })
      .catch(this.options.onerror);
    return this;
  }

  stop(): Watcher {
    this.watcher?.close();
    return this;
  }
}
