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

type WatcherEvent = { type: 'jump' | 'refresh', relative: string };

export class SimpleQueue {
  watcher: Watcher;

  queue: WatcherEvent[] = [];

  schedule?: NodeJS.Timeout;

  constructor(watcher: Watcher) {
    this.watcher = watcher;
  }

  enque(event: WatcherEvent) {
    // TODO: more dispatch strategy
    if (event.type === 'jump') {
      this.queue = [event];
    } else if (event.type === 'refresh') {
      this.queue = this.queue.filter((e) => e.type !== event.type || e.relative !== event.relative);
      this.queue.push(event);
    }

    if (!this.schedule) {
      this.schedule = setTimeout(() => this.dispatch(), 300);
    }
  }

  async dispatch() {
    const top = this.queue.shift();

    if (top) {
      try {
        await this.watcher[top.type](top.relative);
        return await this.watcher.sendData();
      } catch (e) {
        return await this.watcher.sendError(e as Error);
      } finally {
        if (this.queue.length > 0) {
          this.schedule = setTimeout(() => this.dispatch(), 300);
        } else {
          this.schedule = undefined;
        }
      }
    }
    // IDLE
    return Promise.resolve();
  }

  clear() {
    this.queue = [];
  }
}

export class Watcher {
  root: string;

  ignores: RegExp[];

  logger: Logger;

  remark: WatcherOptions['remark'];

  watcher?: chokidar.FSWatcher;

  emit?: EmitFunction<ServerToClientEvents, ServerEvents>

  current?: PenDirectoryData;

  queue: SimpleQueue;

  constructor(options: WatcherOptions) {
    this.root = options.root;
    this.ignores = options.ignores;
    this.logger = options.logger;
    this.remark = options.remark;
    this.queue = new SimpleQueue(this);
  }

  setupEmit(emit: Watcher['emit']) {
    this.emit = emit;
  }

  setupWatching(relative: string) {
    this.queue.enque({
      type: 'jump',
      relative,
    });
  }

  async jump(jumpTo: string) {
    const pathInfo = resolvePathInfo(this.root, jumpTo);

    if (pathInfo.type === 'directory') {
      if (this.current?.relativePath !== pathInfo.relativePath) {
        await this.setupWatcher(pathInfo);
      }
    } else {
      const parent = path.dirname(pathInfo.fullpath);
      const relative = formatRelative(path.relative(this.root, parent));

      // jump to nested child doc, change watch dir to its parent
      if (relative !== this.current?.relativePath) {
        const parentInfo = resolvePathInfo(this.root, relative);

        await this.setupWatcher(parentInfo);
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
          this.queue.enque(
            {
              type: 'refresh',
              relative: this.current.reading
                ? this.current.reading.relativePath
                : this.current.relativePath,
            },
          );
        }
        break;
      case 'change':
        if (this.current && this.current.reading?.relativePath === relative) {
          this.queue.enque(
            {
              type: 'refresh',
              relative,
            },
          );
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
    } catch (e) {
      if (this.current) {
        this.current.reading = undefined;
      }
      throw e;
    }
  }

  protected async setupWatcher(pathInfo: PathInfo) {
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

  async sendData() {
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
    this.queue.clear();
    return this.watcher?.close();
  }
}
