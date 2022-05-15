/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
/* eslint-disable no-param-reassign */
import path from 'path';
import chokidar from 'chokidar';
import {
  PathInfo,
  EmitFunction,
  ServerEvents,
  WatcherOptions,
  PenMarkdownData,
  PenDirectoryData,
  ServerToClientEvents,
} from '../types';
import {
  formatPath,
  isReadme,
} from '../utils';
import { Logger } from './logger';
import {
  readMarkdown,
  validatePath,
  readDirectory,
  resolvePathInfo,
} from './reader';

export class Watcher {
  root: string;

  ignores: RegExp[];

  logger?: Logger;

  protected watcher?: chokidar.FSWatcher;

  remark: WatcherOptions['remark'];

  emit?: EmitFunction<ServerToClientEvents, ServerEvents>

  // for test
  ready: boolean = true;

  constructor(options: WatcherOptions) {
    this.root = options.root;
    this.ignores = options.ignores;
    this.logger = options.logger;
    this.remark = options.remark;
  }

  setupEmit(emit: Watcher['emit']) {
    this.emit = emit;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async setupWatching(_switchTo: string) {
    throw new Error('setupWatching not implemented');
  }

  goUpdir() {
    throw new Error('goUpdir not implemented');
  }

  protected async setupWatcher(pathInfo: PathInfo) {
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async onChange(_event: string, _detail: string) {
    throw new Error('onChange not implemented');
  }

  protected async onError(e?: Error) {
    const error = e?.message ? e : new Error('An unexpect error has occured when watching files');
    const message = await this.remark.processError(error);

    this.logger?.error(error.message);
    this.emit?.(ServerEvents.PenError, {
      type: 'error',
      message,
    });

    return undefined;
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
    return this.watcher?.close();
  }
}

class DirectoryWatcher extends Watcher {
  current?: PenDirectoryData;

  async setupWatching(switchTo: string) {
    if (formatPath(switchTo) === this.current?.relativePath) {
      // back from child doc to self, clear reading
      this.current.reading = undefined;
      this.logger?.info(`Pen use cache, still watching ${this.current.relativePath}`);
      this.sendData();
      return;
    }

    try {
      const pathInfo = resolvePathInfo(this.root, switchTo);

      validatePath(pathInfo, this.ignores);

      if (pathInfo.type === 'directory') {
        await this.setupWatcher(pathInfo);
        await this.onDirChange(pathInfo.relativePath);
      } else {
        const parent = formatPath(path.relative(this.root, path.dirname(pathInfo.fullpath)));

        // jump
        if (parent !== this.current?.relativePath) {
          const parentInfo = resolvePathInfo(this.root, parent);

          validatePath(parentInfo, this.ignores);

          await this.setupWatcher(parentInfo);
          await this.onDirChange(parentInfo.relativePath);
        }
        await this.onFileChange(pathInfo.relativePath);
      }

      this.sendData();
    } catch (e) {
      const err = e as Error;
      await this.onError(new Error(`Error on setupWatching: ${err.message}`, { cause: err }));
    }
  }

  protected async onChange(event: string, detail: string) {
    this.ready = false;
    const relative = formatPath(path.relative(this.root, detail));

    const isSelf = this.current?.relativePath === relative;
    const isChild = formatPath(path.dirname(detail)) === formatPath(path.join(this.root, this.current?.relativePath ?? ''));

    if (!(isSelf || isChild)) { return; }

    this.logger?.info(`Pen detected ${event}: ${relative}`);

    switch (event) {
      case 'addDir':
      case 'unlinkDir':
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        await this.onDirChange(this.current!.relativePath);
        break;
      case 'add':
      case 'unlink':
        if (this.current && isChild) {
          // not this.onDirChange(relative) because we want to refresh current.chidren, not change current
          await this.onDirChange(this.current.relativePath);

          if (isReadme(relative) || this.isReading(relative)) {
            await this.onFileChange(relative);
          }
        }
        break;
      case 'change':
        if (this.current && isChild) {
          if (isReadme(relative) || this.isReading(relative)) {
            await this.onFileChange(relative);
          }
        }
        break;
      default:
        break;
    }
    this.sendData();
    this.ready = true;
  }

  protected isReading(relative: string) {
    return this.current?.reading?.relativePath === relative;
  }

  protected async onDirChange(relative: string) {
    try {
      const pathInfo = resolvePathInfo(this.root, relative);
      const current = await readDirectory(pathInfo, this.root, this.ignores);

      if (current?.readme) {
        current.readme = {
          ...current.readme,
          content: await this.remark.process(current.readme.content),
        };
      }

      // change current
      this.current = current;
    } catch (e) {
      this.current = undefined;
      await this.onError(e as Error);
    }
  }

  protected async onFileChange(relative: string) {
    if (this.current) {
      try {
        const pathInfo = resolvePathInfo(this.root, relative);
        const markdown = await readMarkdown(pathInfo);

        const reading = {
          ...markdown,
          content: await this.remark.process(markdown.content),
        };

        if (isReadme(relative)) {
          this.current.readme = reading;
        }
        this.current.reading = reading;
      } catch (e) {
        if (isReadme(relative)) {
          this.current.readme = undefined;
        }
        this.current.reading = undefined;

        await this.onError(e as Error);
      }
    }
  }

  protected sendData() {
    // trigger server push
    if (this.current) {
      this.emit?.(ServerEvents.PenData, this.current);
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
        return this.onError(e as Error);
      }
    }
    return Promise.resolve();
  }
}

class MarkdownWatcher extends Watcher {
  current?: PenMarkdownData;

  async setupWatching(switchTo: string) {
    if (this.current) {
      if (this.current.relativePath !== formatPath(switchTo)) {
        this.onError(new Error(`Pen not permit to watch ${switchTo}`));
        return;
      }

      if (this.watcher) {
        this.logger?.info(`Pen use cache, still watching ${this.current.relativePath}`);
        this.sendData();
        return;
      }
    }

    try {
      const pathInfo = resolvePathInfo(this.root, '');

      validatePath(pathInfo, this.ignores);

      await this.setupWatcher(pathInfo);
      await this.onFileChange();

      this.sendData();
    } catch (e) {
      await this.onError(e as Error);
    }
  }

  protected async onChange(event: string, detail: string) {
    this.ready = false;
    const relative = formatPath(path.relative(this.root, detail));
    const isSelf = this.current?.relativePath === relative;

    if (!isSelf) { return; }

    this.logger?.info(`Pen detected ${event}: ${this.current?.filename}`);

    switch (event) {
      case 'add':
      case 'unlink':
      case 'change':
        await this.onFileChange();
        break;
      default:
        break;
    }
    this.sendData();
    this.ready = true;
  }

  protected async onFileChange() {
    try {
      const pathInfo = resolvePathInfo(this.root, '');
      const markdown = await readMarkdown(pathInfo);

      const reading = {
        ...markdown,
        content: await this.remark.process(markdown.content),
      };

      this.current = reading;
    } catch (e) {
      this.current = undefined;
      await this.onError(e as Error);
    }
  }

  protected sendData() {
    // trigger server push
    if (this.current) {
      this.emit?.(ServerEvents.PenData, this.current);
    }
  }

  goUpdir() {
    return this.onError(new Error('Pen cannot goUpdir because it\'s in markdown mode'));
  }
}

export const createWatcher = (options: WatcherOptions) => {
  const { root, logger } = options;
  const info = resolvePathInfo(root, '');

  logger?.info(`Pen init to watch ${info.type}: ${info.filename}`);

  return info.type === 'markdown'
    ? new MarkdownWatcher({ ...options, root: info.fullpath })
    : new DirectoryWatcher({ ...options, root: info.fullpath });
};
