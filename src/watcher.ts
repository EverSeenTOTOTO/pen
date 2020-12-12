import nodeWatch from 'node-watch';
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

const MarkdownFilePattern = /^[^.].*.(md|markdown)$/;
const isDir = (filepath: string) => {
  const stat = fs.statSync(filepath);
  return stat.isDirectory();
};
const readMarkdownFiles = (path: string): Promise<MdContent> => {
  if (isDir(path)) {
    return fs.promises.readdir(path)
      .then((files) => files.map((filename: string) => {
        if (MarkdownFilePattern.test(filename)) {
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
};

export default class Watcher {
  private readonly options: WatcherOptions;

  private watcher?: FSWatcher;

  constructor(opts: WatcherOptions) {
    this.options = opts;
  }

  start(): Watcher {
    this.stop();
    const watch = nodeWatch(this.options.path, {
      recursive: false,
      filter: MarkdownFilePattern,
    });
    watch.on('change', this.trigger.bind(this));
    watch.on('error', this.options.onerror);

    this.watcher = watch;
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
