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

  current?: PenDirectoryData;

  constructor(options: WatcherOptions) {
    this.root = options.root;
    this.ignores = options.ignores;
    this.logger = options.logger;
    this.remark = options.remark;
  }

  setupEmit(emit: Watcher['emit']) {
    this.emit = emit;
  }

  async setupWatching(switchTo: string) {
    this.logger.log(`Pen requested: ${formatPath(switchTo)}, current watching: ${this.current?.relativePath ?? 'nothing'}`);
    try {
      const pathInfo = resolvePathInfo(this.root, switchTo);

      validatePath(pathInfo, this.ignores);

      if (pathInfo.type === 'directory') {
        if (this.current?.relativePath !== pathInfo.relativePath) {
          await this.setupWatcher(pathInfo);
        }

        this.current = await this.read(pathInfo.relativePath) as PenDirectoryData;
      } else {
        const parent = formatPath(path.relative(this.root, path.dirname(pathInfo.fullpath)));

        // jump to nested child doc, change watch dir to its parent
        if (parent !== this.current?.relativePath) {
          const parentInfo = resolvePathInfo(this.root, parent);

          validatePath(parentInfo, this.ignores);

          await this.setupWatcher(parentInfo);
          this.current = await this.read(parentInfo.relativePath) as PenDirectoryData;
        }
        this.current.reading = await this.read(pathInfo.relativePath) as PenMarkdownData;
      }

      this.logger.log(`Pen switched to ${pathInfo.fullpath}`);
      this.sendData();
    } catch (e) {
      const err = e as Error;
      await this.sendError(new Error(`${err.message}`, { cause: err }));
    }
  }

  protected async onChange(event: string, detail: string) {
    const relative = formatPath(path.relative(this.root, detail));

    const isSelf = this.current?.relativePath === relative;
    const isChild = formatPath(path.dirname(detail)) === formatPath(path.join(this.root, this.current?.relativePath ?? ''));
    const isReading = this.current?.reading?.relativePath === relative;

    this.logger.log(`Pen detected ${event}: ${relative}`);

    if (!(isSelf || isChild)) return;

    switch (event) {
      case 'addDir':
      case 'unlinkDir':
        if (this.current) {
          try {
            // not this.onDirChange(relative) because we want to refresh current.chidren, not change current
            const current = await this.read(this.current.relativePath) as PenDirectoryData;
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.current = {
              ...current,
              reading: this.current.reading, // keep reading
            };

            this.sendData();
          } catch (e) {
            await this.sendError(e as Error);
          }
        }
        break;
      case 'add':
      case 'unlink':
        if (this.current && isChild) {
          try {
            const current = await this.read(this.current.relativePath) as PenDirectoryData;

            if (isReading) {
              current.reading = await this.read(relative) as PenMarkdownData;
            } else {
              current.reading = this.current.reading;
            }

            this.current = current;
            this.sendData();
          } catch (e) {
            await this.sendError(e as Error);
          }
        }
        break;
      case 'change':
        if (this.current && isChild && isReading) {
          try {
            this.current.reading = await this.read(relative) as PenMarkdownData;
            this.sendData();
          } catch (e) {
            this.current.reading = undefined;
            this.sendError(e as Error);
          }
        }
        break;
      default:
        break;
    }
  }

  protected async setupWatcher(pathInfo: PathInfo) {
    await this.watcher?.close();

    return new Promise<void>((resolve) => {
      this.watcher = chokidar.watch(pathInfo.fullpath, {
        depth: 0,
        ignored: this.ignores,
        awaitWriteFinish: {
          pollInterval: 100,
          stabilityThreshold: 300,
        },
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

  protected read(relative: string) {
    return readUnknown({
      relative,
      root: this.root,
      remark: this.remark,
      ignores: this.ignores,
    });
  }

  protected async sendData() {
    if (this.current) {
      this.emit?.(ServerEvents.PenData, this.current);
    }
  }

  protected async sendError(e?: Error) {
    const error = e?.message ? e : new Error('An unexpect error has occured.');
    const { message } = await this.remark.processError(error);

    this.logger.error(error.message);
    this.emit?.(ServerEvents.PenError, {
      type: 'error',
      message,
    });

    return undefined;
  }

  close() {
    this.emit = undefined;
    this.current = undefined;
    return this.watcher?.close();
  }
}
