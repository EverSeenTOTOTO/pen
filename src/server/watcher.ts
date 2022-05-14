/* eslint-disable no-param-reassign */
import chokidar from 'chokidar';
import {
  PathInfo,
  EmitFunction,
  ServerEvents,
  PenMarkdownData,
  PenDirectoryData,
  ServerToClientEvents,
} from '../types';
import {
  path, isReadme,
} from '../utils';
import { Logger } from './logger';
import { renderError } from './rehype';
import {
  resolvePathInfo, readDirectory, readMarkdown, validatePath,
} from './reader';

export type WatcherOptions = {
  root: string;
  ignores: RegExp[];
  logger?: Logger;
  emit: EmitFunction<ServerToClientEvents, ServerEvents>
};

export class Watcher {
  root: string;

  current?: PenMarkdownData | PenDirectoryData;

  ignores: RegExp[];

  logger?: Logger;

  protected watcher?: chokidar.FSWatcher;

  emit: WatcherOptions['emit']

  // for test
  ready: boolean = true;

  constructor(options: WatcherOptions) {
    this.root = options.root;
    this.ignores = options.ignores;
    this.logger = options.logger;
    this.emit = options.emit;
  }

  async setupWatching(switchTo: string) {
    if (switchTo === this.current?.relativePath) {
      // back from child doc to self, clear reading
      if (this.current?.type === 'directory') {
        this.current.reading = undefined;
      }
      this.logger?.info(`Pen use cache, still watching ${this.current.relativePath}`);
      this.sendData();
      return;
    }

    try {
      const pathInfo = resolvePathInfo(this.root, switchTo);

      validatePath(pathInfo, this.ignores);

      await this.setupWatcher(pathInfo);

      if (pathInfo.type === 'directory') {
        await this.onDirChange(pathInfo.relativePath);
      } else {
        await this.onFileChange(pathInfo.relativePath);
      }

      this.logger?.done(`Pen switched to watch ${pathInfo.relativePath}`);
      this.sendData();
    } catch (e) {
      const err = e as Error;
      this.onError(new Error(`Error on setupWatching: ${err.message}`, { cause: err }));
    }
  }

  protected async setupWatcher(pathInfo: PathInfo) {
    if (this.current) {
    // already watching parent dir
      if (this.current.type === 'directory' && this.current.children.find((c) => c.relativePath === pathInfo.relativePath)) return;

      this.logger?.warn(`Pen stopped watching ${this.current.relativePath}`);
    }
    await this.close();

    // eslint-disable-next-line consistent-return
    return new Promise<void>((resolve) => {
      this.watcher = chokidar.watch(pathInfo.fullpath, {
        depth: 0,
        ignored: this.ignores,
      });
      this.watcher.on('error', (e) => {
        this.onError(new Error(`Error in watcher: ${e.message}`, { cause: e }));
      });
      this.watcher.on('ready', () => {
        this.watcher?.on('all', this.onChange.bind(this));
        resolve();
      });
    });
  }

  protected async onChange(event: string, detail: string) {
    const relative = path.relative(this.root, detail);

    this.logger?.info(`Pen detected ${event}: ${relative}`);

    const isSelf = this.current?.relativePath === relative;
    const isChild = this.current?.type === 'directory' && path.dirname(detail) === path.join(this.root, this.current.relativePath);

    switch (event) {
      case 'addDir':
      case 'unlinkDir':
        if (isSelf || isChild) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          await this.onDirChange(this.current!.relativePath);
        }
        break;
      case 'add':
      case 'unlink':
        if (isSelf) {
          await this.onFileChange(relative);
        } else if (this.current?.type === 'directory' && isChild) {
          await this.onDirChange(this.current.relativePath); // not onDirChange(relative)

          if (isReadme(relative)) {
            this.current.readme = await this.readReadme(relative);
          } else if (this.current.reading?.relativePath === relative) { // isReading
            await this.onFileChange(relative);
          }
        }
        break;
      case 'change':
        if (isSelf) {
          await this.onFileChange(relative);
        } else if (this.current?.type === 'directory' && isChild) {
          if (isReadme(relative)) {
            this.current.readme = await this.readReadme(relative);
          } else if (this.current.reading?.relativePath === relative) {
            await this.onFileChange(relative);
          }
        }
        break;
      default:
        break;
    }
    this.sendData();
  }

  protected async readReadme(relative: string) {
    try {
      const pathInfo = resolvePathInfo(this.root, relative);
      validatePath(pathInfo, this.ignores);
      return await readMarkdown(pathInfo);
    } catch (e) {
      this.logger?.warn(`Pen ignored README file: ${relative}`);
      return undefined;
    }
  }

  protected async onDirChange(relative: string) {
    try {
      const pathInfo = resolvePathInfo(this.root, relative);
      this.current = await readDirectory(pathInfo, this.root, this.ignores);
    } catch (e) {
      const err = e as Error;
      this.onError(new Error(`Error on DirChange: ${err.message}`, { cause: err }));
    }
  }

  protected async onFileChange(relative: string) {
    try {
      const pathInfo = resolvePathInfo(this.root, relative);
      const markdown = await readMarkdown(pathInfo);

      if (this.current?.type === 'directory') {
        this.current.reading = markdown;
      } else {
        this.current = markdown;
      }
    } catch (e) {
      const err = e as Error;
      this.onError(new Error(`Error on FileChange: ${err.message}`, { cause: err }));
    }
  }

  protected onError(e?: Error) {
    const error = e ?? new Error('An unexpect error has occured, but pen is unable to determine why...');
    const message = renderError(error);

    this.current = undefined;
    this.logger?.error(error.message);
    this.emit(ServerEvents.PenError, {
      type: 'error',
      message,
    });

    return undefined;
  }

  protected sendData() {
    // trigger server push
    if (this.current) {
      if (this.current.type === 'directory') {
        const { children } = this.current;

        children.forEach((c) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          delete c.fullpath;
        });

        this.emit(ServerEvents.PenData, { ...this.current, children });
      } else {
        this.emit(ServerEvents.PenData, this.current);
      }
    }
  }

  goUpdir() {
    if (this.current) {
      try {
        const relative = path.dirname(this.current.relativePath);
        const updir = resolvePathInfo(this.root, relative);

        validatePath(updir, this.ignores);

        return this.setupWatching(updir.relativePath);
      } catch (e) {
        this.onError(e as Error);
      }
    }
    return Promise.resolve();
  }

  isReady() {
    return new Promise<void>((res) => {
      const interval = setInterval(() => {
        if (this.ready) {
          clearInterval(interval);
          res();
        }
      }, 300);
    });
  }

  close() {
    this.current = undefined;
    return this.watcher?.close();
  }
}
