import { resolve } from 'path';
import fs, { FSWatcher } from 'fs';
import mdrender from './markdown';

export type MdContent = string | {
  filename?: string,
  type: 'markdown' | 'dir' | 'other'
}[];

type WatcherOptions = {
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

  start(): Watcher {
    this.stop();
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
    return this;
  }

  trigger(): Watcher {
    readMarkdownFiles(this.options.path)
      .then((content) => {
        if (typeof content !== 'string') {
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
