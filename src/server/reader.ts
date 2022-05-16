/* eslint-disable no-param-reassign */
import fs from 'fs';
import path from 'path';
import {
  PathInfo,
  PenMarkdownData,
  PenDirectoryData,
} from '../types';
import {
  formatPath, isDir, isMarkdown, isReadme,
} from '../utils';

function fullPath(root: string, switchTo: string) {
  return path.join(root, switchTo.replace(/~$/, '')); //  It's weird sometimes got xxx.md~
}

export function resolvePathInfo(root: string, switchTo: string):PathInfo {
  const fullpath = fullPath(root, switchTo);
  const filename = path.basename(fullpath);

  return {
    fullpath,
    filename,
    relativePath: formatPath(path.relative(root, fullpath)),
    // eslint-disable-next-line no-nested-ternary
    type: isDir(fullpath) ? 'directory' : isMarkdown(fullpath) ? 'markdown' : 'other',
  };
}

export function validatePath(pathInfo: PathInfo, ignores: RegExp[]) {
  if (ignores.some((re) => re.test(pathInfo.filename))) {
    throw new Error(`Pen not permitted to watch: ${pathInfo.fullpath}, it's ignored by settings.`);
  }

  if (!fs.existsSync(pathInfo.fullpath)) {
    throw new Error(`Pen not permitted to watch: ${pathInfo.fullpath}, no such file or directory.`);
  }

  if (pathInfo.type === 'other') {
    throw new Error(`Pen unable to watch: ${pathInfo.fullpath}, it's not a markdown file.`);
  }
}

function sortChildren(a: PathInfo, b: PathInfo) {
  if (a.type !== b.type && a.type === 'directory') return -1; // directory first
  // dot file first
  if (a.filename.startsWith('.') && b.filename.startsWith('.')) {
    return a.filename < b.filename ? -1 : 0;
  }
  if (a.filename.startsWith('.')) return -1;
  if (b.filename.startsWith('.')) return 1;

  return a.filename < b.filename ? -1 : 0;
}

export async function readMarkdown(pathInfo: PathInfo): Promise<PenMarkdownData> {
  const content = await fs.promises.readFile(pathInfo.fullpath, 'utf8');

  return {
    type: 'markdown',
    content,
    filename: pathInfo.filename,
    relativePath: pathInfo.relativePath,
  };
}

export async function readDirectory(pathInfo: PathInfo, root: string, ignores: RegExp[]): Promise<PenDirectoryData | undefined> {
  const dirs = await fs.promises.readdir(pathInfo.fullpath);
  const infos = dirs
    .map((dir) => path.join(pathInfo.fullpath, dir))
    .map((dir) => resolvePathInfo(root, path.relative(root, dir)))
    .filter((info) => info.type !== 'other')
    .filter((info) => {
      try {
        validatePath(info, ignores);
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
    readme: readme.length > 0
      ? await readMarkdown(readme[0])
      : undefined,
    children: infos.sort(sortChildren).map((c) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      delete c.fullpath;
      return c;
    }),
  };
}

export async function readUnknown(relative: string, root: string, ignores: RegExp[]) {
  const pathInfo = resolvePathInfo(root, relative);

  return pathInfo.type === 'directory'
    ? readDirectory(pathInfo, root, ignores)
    : readMarkdown(pathInfo);
}
