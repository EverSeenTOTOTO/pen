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
  PenDirectoryData,
  ServerToClientEvents,
} from '../types';
import { formatRelative, resolvePathInfo } from '../utils';
import { Logger } from './logger';
import { readUnknown } from './reader';

export class Watcher {
  root: string;

  ignores: RegExp[];

  logger: Logger;

  remark: WatcherOptions['remark'];

  watcher?: chokidar.FSWatcher;

  emit?: EmitFunction<ServerToClientEvents, ServerEvents>

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

  async setupWatching(jumpTo: string) {
    const pathInfo = resolvePathInfo(this.root, jumpTo);

    if (pathInfo.type === 'directory') {
      if (this.current?.relativePath !== pathInfo.relativePath) {
        await this.initWatcher(pathInfo);
      }
    } else {
      const parent = path.dirname(pathInfo.fullpath);
      const relative = formatRelative(path.relative(this.root, parent));

      // jump to nested child doc, change watch dir to its parent
      if (relative !== this.current?.relativePath) {
        const parentInfo = resolvePathInfo(this.root, relative);

        await this.initWatcher(parentInfo);
      }
    }

    await this.refresh(pathInfo.relativePath);

    this.logger.log(`Pen switched to ${pathInfo.fullpath}`);
  }

  protected onChange(event: string, detail: string) {
    const relative = formatRelative(path.relative(this.root, detail));

    this.logger.log(`Pen detected ${event}: ${relative}`);

    switch (event) {
      case 'addDir':
      case 'add':
      case 'unlinkDir':
      case 'unlink':
        if (this.current) {
          this.refresh(this.current.reading
            ? this.current.reading.relativePath
            : this.current.relativePath);
        }
        break;
      case 'change':
        if (this.current && this.current.reading?.relativePath === relative) {
          this.refresh(relative);
        }
        break;
      default:
        break;
    }
  }

  async refresh(relative: string) {
    try {
      this.current = await readUnknown({
        relative,
        root: this.root,
        remark: this.remark,
        ignores: this.ignores,
      });
      this.sendData();
    } catch (e) {
      if (this.current) {
        this.current.reading = undefined;
      }
      this.sendError(e as Error);
    }
  }

  protected async initWatcher(pathInfo: PathInfo) {
    await this.watcher?.close();

    return new Promise<void>((resolve, reject) => {
      this.watcher = chokidar.watch(pathInfo.fullpath, {
        depth: 0,
        ignored: this.ignores,
        awaitWriteFinish: {
          pollInterval: 100,
          stabilityThreshold: 1000,
        },
      });
      this.watcher.on('error', (e) => {
        this.sendError(e);
        reject();
      });
      this.watcher.on('ready', () => {
        this.watcher?.on('all', this.onChange.bind(this));
        resolve();
      });
    });
  }

  sendData() {
    if (this.current) {
      this.emit?.(ServerEvents.PenData, this.current);
    }
  }

  async sendError(e?: Error) {
    const error = e?.message ? e : new Error('An error has occured.', { cause: e });
    const { message } = await this.remark.processError(error);

    this.logger.error(error.message);

    this.emit?.(ServerEvents.PenError, {
      type: 'error',
      message,
    });
  }

  close() {
    this.emit = undefined;
    this.current = undefined;
    return this.watcher?.close();
  }
}
