import fs from 'fs';
import {
  PathInfo,
  PenMarkdownData,
  PenDirectoryData,
} from '../types';
import {
  path, isDir, isMarkdown, isReadme,
} from '../utils';

function fullPath(root: string, switchTo: string) {
  return path.join(root, switchTo.replace(/~$/, '')); //  It's weird sometimes got xxx.md~
}

export function resolvePathInfo(root: string, switchTo: string):PathInfo {
  const fullpath = fullPath(root, switchTo); //  It's weird sometimes got xxx.md~
  const filename = path.basename(fullpath);

  return {
    fullpath,
    filename,
    relativePath: path.relative(root, fullpath),
    // eslint-disable-next-line no-nested-ternary
    type: isDir(fullpath) ? 'directory' : isMarkdown(fullpath) ? 'markdown' : 'other',
  };
}

export function validatePath(pathInfo: PathInfo, ignores: RegExp[]) {
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

export async function readMarkdown(pathInfo: PathInfo): Promise<PenMarkdownData> {
  const content = await fs.promises.readFile(pathInfo.fullpath, 'utf8');

  return {
    content,
    filename: pathInfo.filename,
    relativePath: pathInfo.relativePath,
    type: 'markdown',
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
    children: infos.sort(sortChildren),
    readme: readme.length > 0
      ? await readMarkdown(readme[0])
      : undefined,
  };
}

export async function readUnknown(relative: string, root: string, ignores: RegExp[]) {
  const pathInfo = resolvePathInfo(root, relative);

  return isDir(pathInfo.fullpath)
    ? readDirectory(pathInfo, root, ignores)
    : readMarkdown(pathInfo);
}
