import fs from 'fs';
import {
  PenData,
  ServerEvents,
  PathInfo,
  PenMarkdownData,
  PenDirectoryData,
} from '@/types';
import chokidar from 'chokidar';
import {
  path, isDir, isMarkdown, isReadme,
} from '@/utils';
import { Logger } from './logger';
import { renderError } from './render';

function fullPath(root: string, switchTo: string) {
  return path.join(root, switchTo.replace(/~$/, '')); //  It's weird sometimes got xxx.md~
}

function resolvePathInfo(watcher: Watcher, switchTo: string):PathInfo {
  const { root } = watcher;
  const fullpath = fullPath(root, switchTo); //  It's weird sometimes got xxx.md~
  const filename = path.basename(fullpath);

  return {
    fullpath,
    filename,
    relativePath: path.relative(watcher.root, fullpath),
    // eslint-disable-next-line no-nested-ternary
    type: isDir(fullpath) ? 'directory' : isMarkdown(fullpath) ? 'markdown' : 'other',
  };
}

function validatePath(watcher: Watcher, pathInfo: PathInfo) {
  const { ignores } = watcher;

  if (ignores.some((re) => re.test(pathInfo.relativePath))) {
    throw new Error(`Pen not permitted to watch: ${pathInfo.fullpath}, it's ignored by settings.`);
  }

  if (!fs.existsSync(pathInfo.fullpath)) {
    throw new Error(`Pen not permitted to watch: ${pathInfo.fullpath}, no such file or directory.`);
  }

  if (!(isDir(pathInfo.fullpath) || isMarkdown(pathInfo.fullpath))) {
    throw new Error(`Pen unable to watch: ${pathInfo.fullpath}, it's not a markdown file.`);
  }
}

function sortChildren(a: PathInfo, b: PathInfo) {
  if (a.type !== b.type && a.type === 'directory') return -1;
  return 0;
}

async function readMarkdown(pathInfo: PathInfo): Promise<PenMarkdownData> {
  const content = await fs.promises.readFile(pathInfo.fullpath, 'utf8');

  return {
    content,
    filename: pathInfo.filename,
    relativePath: pathInfo.relativePath,
    type: 'markdown',
  };
}

export type WatcherOptions = {
  root: string;
  ignores: RegExp[];
  logger?: Logger;
  emit: (event: ServerEvents, data: PenData) => void;
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
      const pathInfo = resolvePathInfo(this, switchTo);

      validatePath(this, pathInfo);

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

  protected async readDirectory(pathInfo: PathInfo): Promise<PenDirectoryData | undefined> {
    this.ready = false;
    try {
      const dirs = await fs.promises.readdir(pathInfo.fullpath);
      const infos = dirs
        .map((dir) => path.join(pathInfo.fullpath, dir))
        .map((dir) => resolvePathInfo(this, path.relative(this.root, dir)))
        .filter((info) => info.type !== 'other')
        .filter((info) => {
          try {
            validatePath(this, info);
            return true;
          } catch {
            return false;
          }
        });
      const readme = infos.filter((each) => isReadme(each.relativePath));

      return {
        type: 'directory',
        filename: pathInfo.filename,
        relativePath: pathInfo.relativePath,
        children: infos.sort(sortChildren),
        readme: readme.length > 0
          ? await this.readReadme(readme[0].relativePath)
          : undefined,
      };
    } catch (e) {
      const err = e as Error;
      return this.onError(new Error(`Error on readDirectory: ${err.message}`, { cause: err }));
    } finally {
      this.ready = true;
    }
  }

  protected async readMarkdown(pathInfo: PathInfo): Promise<PenMarkdownData | undefined> {
    this.ready = false;

    try {
      return await readMarkdown(pathInfo);
    } catch (e) {
      const err = e as Error;
      return this.onError(new Error(`Error on readMarkdown: ${err.message}`, { cause: err }));
    } finally {
      this.ready = true;
    }
  }

  protected async readReadme(relative: string) { // nothrow
    try {
      const pathInfo = resolvePathInfo(this, relative);
      validatePath(this, pathInfo);
      return await readMarkdown(pathInfo);
    } catch (e) {
      return undefined;
    }
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

  protected async onDirChange(relative: string) {
    try {
      this.current = await this.readDirectory(resolvePathInfo(this, relative));
    } catch (e) {
      const err = e as Error;
      this.onError(new Error(`Error on DirChange: ${err.message}`, { cause: err }));
    }
  }

  protected async onFileChange(relative: string) {
    try {
      const markdown = await this.readMarkdown(resolvePathInfo(this, relative));

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
      this.emit(ServerEvents.PenChange, this.current);
    }
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
