import path from 'path';
import fs from 'fs';
import sort from 'alphanum-sort';
import {
  PenData,
  ServerEvents,
  PenChangeData,
  PenMarkdownData,
  PenDirectoryData,
} from '@/types';
import chokidar from 'chokidar';
import { slash } from '@/utils';
import { Logger } from './logger';
import { renderError } from './render';

type PathInfo = {
  type: 'directory' | 'markdown' | 'other',
  fullpath: string,
  relativePath: string,
};

function isDir(filepath: string) {
  const stat = fs.statSync(filepath);
  return stat.isDirectory();
}

function isMarkdown(filepath: string) {
  return /\.(md|markdown)$/.test(filepath);
}

function fullPath(watchRoot: string, switchTo: string) {
  return slash(path.join(watchRoot, switchTo.replace(/~$/, ''))); //  It's weird sometimes got xxx.md~
}

function resolvePath(watcher: Watcher, switchTo: string, nothrow = false):PathInfo {
  const { watchRoot, ignores } = watcher;
  const fullpath = fullPath(watchRoot, switchTo); //  It's weird sometimes got xxx.md~

  if (!nothrow) {
    if (!fs.existsSync(fullpath)) {
      throw new Error(`Pen not permitted to watch: ${fullpath}, file doesn't exist.`);
    }

    if (ignores.some((re) => re.test(switchTo))) {
      throw new Error(`Pen not permitted to watch: ${fullpath}, it's ignored by settings.`);
    }

    if (!(isDir(fullpath) || isMarkdown(fullpath))) {
      throw new Error(`Pen unable to watch: ${fullpath}, it's not a markdown file.`);
    }
  }

  return {
    fullpath,
    relativePath: switchTo,
    // eslint-disable-next-line no-nested-ternary
    type: isDir(fullpath) ? 'directory' : isMarkdown(fullpath) ? 'markdown' : 'other',
  };
}

export type WatcherOptions = {
  watchRoot: string;
  ignores: RegExp[];
  logger?: Logger;
  emit: (event: ServerEvents, data: PenData) => void;
};

export class Watcher {
  watchRoot: string;

  currentCache: Promise<PenMarkdownData | PenDirectoryData | undefined>;

  ignores: RegExp[];

  logger?: Logger;

  watcher?: chokidar.FSWatcher;

  emit: WatcherOptions['emit']

  constructor(options: WatcherOptions) {
    this.watchRoot = options.watchRoot;
    this.ignores = options.ignores;
    this.logger = options.logger;
    this.emit = options.emit;
    this.currentCache = Promise.resolve(undefined);
  }

  async setupWatching(switchTo: string) {
    const current = await this.currentCache;

    if (switchTo === current?.relativePath) {
      // /foo/bar -> /foo
      this.currentCache = Promise.resolve({ ...current, reading: undefined });
      return;
    }

    try {
      const pathInfo = resolvePath(this, switchTo);

      await this.initWacher(pathInfo, current);

      if (pathInfo.type === 'directory') {
        this.cacheDirectory(pathInfo);
      } else {
        this.cacheMarkdown(pathInfo);
      }

      this.logger?.info(`Pen ready to watch ${pathInfo.relativePath}`);

      await this.triggerPush();
    } catch (e) {
      this.onError(e as Error);
    }
  }

  protected initWacher(pathInfo: PathInfo, current?: PenMarkdownData | PenDirectoryData) {
    // eslint-disable-next-line consistent-return
    return new Promise<void>((resolve) => {
      if (!this.watcher) {
        this.watcher = chokidar.watch(pathInfo.fullpath, {
          depth: 1,
          ignored: this.ignores,
        });
        this.watcher.on('error', this.onError.bind(this));
        this.watcher.on('ready', () => {
          this.watcher?.on('all', this.onChange.bind(this));
          this.logger?.info(`Pen init watcher with root ${this.watchRoot}`);
          resolve();
        });
      } else {
        if (current) {
          if (current.relativePath === pathInfo.relativePath) return resolve();
          if (current.type === 'directory' && current.children.includes(pathInfo.relativePath)) return resolve();

          this.watcher.unwatch(current.relativePath);
          this.currentCache = Promise.resolve(undefined);
          this.logger?.info(`Pen stopped watching ${current.relativePath}`);
        }

        this.watcher.add(pathInfo.relativePath);
        resolve();
      }
    });
  }

  protected cacheDirectory(pathInfo: PathInfo) {
    this.currentCache = fs.promises.readdir(pathInfo.fullpath)
      .then((dirs) => dirs
        .map((dir) => path.join(pathInfo.fullpath, dir))
        .map((dir) => resolvePath(this, path.relative(this.watchRoot, dir), true))
        .filter((info) => info.type !== 'other'))
      .then((infos): PenDirectoryData => ({
        type: 'directory',
        children: sort(infos.map((each) => each.relativePath)),
        relativePath: pathInfo.relativePath,
      }))
      .catch(this.onError.bind(this));
  }

  protected cacheMarkdown(pathInfo: PathInfo) {
    this.currentCache = Promise.all([
      fs.promises.readFile(pathInfo.fullpath, 'utf8')
        .then((content): PenMarkdownData => ({
          content,
          relativePath: pathInfo.relativePath,
          type: 'markdown',
        }))
        .catch(this.onError.bind(this)),
      this.currentCache,
    ]).then(([markdown, current]) => {
      if (current && current.type === 'directory') {
        // eslint-disable-next-line no-param-reassign
        current.reading = markdown;

        return current;
      }
      return markdown;
    });
  }

  protected async onChange(event: PenChangeData['type'], detail: string) {
    this.logger?.info(`Pen detected ${event}: ${path.relative(this.watchRoot, detail)}`);

    const current = await this.currentCache;

    switch (event) {
      case 'addDir':
      case 'unlinkDir':
        this.onDirChange();
        break;
      case 'change':
        this.onContentChange(detail);
        break;
      case 'add':
      case 'unlink':
        if (current?.type === 'directory') {
          this.onDirChange();
        } else {
          this.onContentChange(detail);
        }
        break;
      default:
        break;
    }
  }

  protected async onDirChange() {
    const current = await this.currentCache;

    if (!current || current.type !== 'directory') return;

    try {
      this.cacheDirectory(resolvePath(this, current.relativePath));
      await this.triggerPush();
    } catch (e) {
      this.onError(e as Error);
    }
  }

  protected async onContentChange(detail: string) {
    const current = await this.currentCache;

    if (!current) return;
    if (current.type === 'markdown' && path.join(this.watchRoot, current.relativePath) !== detail) return; // should not happen
    if (current.type === 'directory' && (!current.reading || (current.reading && path.join(this.watchRoot, current.reading.relativePath) !== detail))) return; // changed, but not the reading one

    try {
      this.cacheMarkdown(resolvePath(this, path.relative(this.watchRoot, detail)));
      await this.triggerPush();
    } catch (e) {
      this.onError(e as Error);
    }
  }

  protected onError(e?: Error) {
    const error = e ?? new Error('An unexpect error has occured, but pen is unable to determine why...');
    const message = renderError(error);

    this.currentCache = Promise.resolve(undefined);
    this.logger?.info(`Pen emit error: ${error.message}`);
    this.emit(ServerEvents.PenError, {
      type: 'error',
      message,
    });

    return undefined;
  }

  triggerPush() {
    // trigger server push
    return this.currentCache.then((data) => {
      this.logger?.info(`Pen emit change: ${data?.relativePath}`);

      if (data) {
        this.emit(ServerEvents.PenChange, data);
      }
    });
  }

  close() {
    this.currentCache = Promise.resolve(undefined);
    return this.watcher?.close();
  }
}
