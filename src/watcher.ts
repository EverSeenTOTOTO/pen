import { resolve } from 'path';
import fs, { FSWatcher } from 'fs';
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

type WatcherOptions = {
  path: string,
  logger?: PenLogger,
  ondata: (data: string) => void,
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

const handleData = (content: MdContent) => {
  let data = '';
  if (Array.isArray(content)) {
    data = JSON.stringify(content.filter((item) => item.type !== 'other' && item.filename));
  } else {
    data = JSON.stringify(content);
  }
  return data;
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

  get logger(): PenLogger | undefined {
    return this.options.logger;
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
              this.options.onerror(new Error(`no such file or directory: ${this.path}`));
            } else {
              this.trigger();
            }
          }
        },
      );
      watcher.on('error', this.options.onerror);

      this.watcher = watcher;
    } catch (e) {
      this.logger?.error(e);
      this.options.onerror(e);
    }

    return this;
  }

  trigger(): Watcher {
    readMarkdownFiles(this.path)
      .then((content) => {
        this.options.ondata(handleData(content));
      })
      .catch((e) => {
        this.logger?.error(e);
        this.options.onerror(e);
      });
    return this;
  }

  stop(): Watcher {
    this.watcher?.close();
    return this;
  }
}
