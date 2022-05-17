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
  resolvePathInfo,
} from '../utils';
import { Logger } from './logger';
import {
  validatePath,
  readUnknown,
} from './reader';

export class Watcher {
  root: string;

  ignores: RegExp[];

  logger: Logger;

  protected watcher?: chokidar.FSWatcher;

  protected remark: WatcherOptions['remark'];

  protected emit?: EmitFunction<ServerToClientEvents, ServerEvents>

  // for test
  protected ready: boolean = true;

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async onChange(_event: string, _detail: string) {
    throw new Error('onChange not implemented');
  }

  protected async setupWatcher(pathInfo: PathInfo) {
    await this.watcher?.close();

    return new Promise<void>((resolve) => {
      this.watcher = chokidar.watch(pathInfo.fullpath, {
        depth: 0,
        ignored: this.ignores,
      });
      this.watcher.on('error', (e) => {
        this.sendError(new Error(`Pen watcher error: ${e.message}`, { cause: e }));
      });
      this.watcher.on('ready', () => {
        this.watcher?.on('all', this.onChange.bind(this));
        resolve();
      });
    });
  }

  protected async sendError(e?: Error) {
    const error = e?.message ? e : new Error('An unexpect error has occured when watching files');
    const message = await this.remark.processError(error);

    this.logger.error(error.message);
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
    this.emit = undefined;
    return this.watcher?.close();
  }
}

class DirectoryWatcher extends Watcher {
  current?: PenDirectoryData;

  close() {
    this.current = undefined;
    return super.close();
  }

  async setupWatching(switchTo: string) {
    this.logger.info(`Pen requested: ${formatPath(switchTo)}, current watching: ${this.current?.relativePath}`);

    if (formatPath(switchTo) === this.current?.relativePath) {
      // back from child doc to self, clear reading
      this.current.reading = undefined;
      this.logger.info(`Pen switched to ${this.current.relativePath}`);
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
        if (this.current?.reading?.relativePath === pathInfo.relativePath) {
          this.logger.info(`Pen sent cache, still watching ${this.current.relativePath}`);
          this.sendData();
          return;
        }

        const parent = formatPath(path.relative(this.root, path.dirname(pathInfo.fullpath)));

        // jump to nested child doc, change watch dir to its parent
        if (parent !== this.current?.relativePath) {
          const parentInfo = resolvePathInfo(this.root, parent);

          validatePath(parentInfo, this.ignores);

          await this.setupWatcher(parentInfo);
          await this.onDirChange(parentInfo.relativePath);
        }
        await this.onFileChange(pathInfo.relativePath);
      }

      this.logger.info(`Pen switched to ${pathInfo.fullpath}`);
      this.sendData();
    } catch (e) {
      const err = e as Error;
      await this.sendError(new Error(`${err.message}`, { cause: err }));
    }
  }

  protected async onChange(event: string, detail: string) {
    this.ready = false;
    const relative = formatPath(path.relative(this.root, detail));

    const isSelf = this.current?.relativePath === relative;
    const isChild = formatPath(path.dirname(detail)) === formatPath(path.join(this.root, this.current?.relativePath ?? ''));

    this.logger.info(`Pen detected ${event}: ${relative}`);

    if (!(isSelf || isChild)) return;

    switch (event) {
      case 'addDir':
      case 'unlinkDir':
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        await this.onDirChange(this.current!.relativePath)
          .then(() => this.sendData())
          .catch((e) => this.sendError(e));
        break;
      case 'add':
      case 'unlink':
        if (this.current && isChild) {
          // not this.onDirChange(relative) because we want to refresh current.chidren, not change current
          await this.onDirChange(this.current.relativePath)
            .then(async () => {
              if (this.current?.reading?.relativePath === relative) {
                await this.onFileChange(relative);
              }
            })
            .then(() => this.sendData())
            .catch((e) => this.sendError(e));
        }
        break;
      case 'change':
        if (this.current && isChild && this.current?.reading?.relativePath === relative) {
          await this.onFileChange(relative)
            .then(() => this.sendData())
            .catch((e) => this.sendError(e));
        }
        break;
      default:
        break;
    }
    this.ready = true;
  }

  protected async onDirChange(relative: string) {
    this.current = await readUnknown({
      relative,
      root: this.root,
      remark: this.remark,
      ignores: this.ignores,
    }) as PenDirectoryData;
  }

  protected async onFileChange(relative: string) {
    if (!this.current) return;

    const reading = await readUnknown({
      relative,
      root: this.root,
      remark: this.remark,
      ignores: this.ignores,
    }) as PenMarkdownData;

    this.changeReading(reading);
  }

  protected changeReading(data: PenMarkdownData | undefined) {
    if (this.current) {
      this.current.reading = data;
      if (!data || isReadme(data?.relativePath)) {
        this.current.readme = data;
      }
    }
  }

  protected sendData() {
    // trigger server push
    if (this.current) {
      this.emit?.(ServerEvents.PenData, this.current);
    }
  }
}

class MarkdownWatcher extends Watcher {
  current?: PenMarkdownData;

  close() {
    this.current = undefined;
    return super.close();
  }

  async setupWatching(switchTo: string) {
    this.logger.info(`Pen requested: ${formatPath(switchTo)}, current watching: ${this.current?.relativePath}`);

    if (this.current) {
      if (this.current.relativePath !== formatPath(switchTo)) {
        this.sendError(new Error(`Pen not permit to watch ${switchTo}`));
        return;
      }

      if (this.watcher) {
        this.logger.info(`Pen sent cache, still watching ${this.current.relativePath}`);
        this.sendData();
        return;
      }
    }

    try {
      const pathInfo = resolvePathInfo(this.root, '');

      validatePath(pathInfo, this.ignores);

      await this.setupWatcher(pathInfo);
      await this.onFileChange();

      this.logger.info(`Pen switched to ${pathInfo.fullpath}`);
      this.sendData();
    } catch (e) {
      await this.sendError(e as Error);
    }
  }

  protected async onChange(event: string, detail: string) {
    this.ready = false;
    const relative = formatPath(path.relative(this.root, detail));
    const isSelf = this.current?.relativePath === relative;

    this.logger.info(`Pen detected ${event}: ${this.current?.filename}`);

    if (!isSelf) return;

    switch (event) {
      case 'add':
      case 'unlink':
      case 'change':
        await this.onFileChange()
          .then(() => this.sendData())
          .catch((e) => {
            this.current = undefined;
            return this.sendError(e);
          });
        break;
      default:
        break;
    }
    this.ready = true;
  }

  protected async onFileChange() {
    this.current = await readUnknown({
      relative: '',
      root: this.root,
      ignores: this.ignores,
      remark: this.remark,
    }) as PenMarkdownData;
  }

  protected sendData() {
    // trigger server push
    if (this.current) {
      this.emit?.(ServerEvents.PenData, this.current);
    }
  }
}

export const createWatcher = (options: WatcherOptions) => {
  const { root, logger } = options;
  const info = resolvePathInfo(root, '');

  logger.info(`Pen init to watch ${info.type}: ${info.filename}`);

  return info.type === 'directory'
    ? new DirectoryWatcher({ ...options, root: info.fullpath })
    : new MarkdownWatcher({ ...options, root: info.fullpath });
};
