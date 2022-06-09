/* eslint-disable no-param-reassign */
import fs from 'fs';
import path from 'path';
import {
  PathInfo,
  PenMarkdownData,
  PenDirectoryData,
  ReaderOptions,
} from '../types';
import {
  isReadme,
  resolvePathInfo,
} from '../utils';
import { RemarkRehype } from './rehype';

function validatePath(pathInfo: PathInfo, ignores: RegExp[]) {
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

async function readMarkdown(render: RemarkRehype, pathInfo: PathInfo): Promise<PenMarkdownData> {
  const content = await fs.promises.readFile(pathInfo.fullpath, 'utf8');
  const data = await render.process(content);

  return {
    type: 'markdown',
    content: data.content,
    toc: data.toc,
    filename: pathInfo.filename,
    relativePath: pathInfo.relativePath,
  };
}

async function readDirectory(root: string, pathInfo: PathInfo, ignores: RegExp[]): Promise<PenDirectoryData> {
  const dirs = await fs.promises.readdir(pathInfo.fullpath);
  const infos = dirs
    .map((dir) => resolvePathInfo(root, path.join(pathInfo.relativePath, dir)))
    .filter((info) => {
      try {
        validatePath(info, ignores);
        return true;
      } catch {
        return false;
      }
    });

  return {
    type: 'directory',
    filename: pathInfo.filename,
    relativePath: pathInfo.relativePath,
    children: infos.sort(sortChildren).map((c) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      delete c.fullpath;
      return c;
    }),
  };
}

export async function readUnknown(options: ReaderOptions) {
  const {
    root, relative, remark, ignores,
  } = options;
  const pathInfo = resolvePathInfo(root, relative);

  validatePath(pathInfo, ignores);

  // if markdown, read its parent
  const directory = pathInfo.type === 'directory' ? pathInfo : resolvePathInfo(root, path.dirname(pathInfo.relativePath));
  const data = await readDirectory(root, directory, ignores);

  if (pathInfo.type === 'markdown') {
    data.reading = await readMarkdown(remark, pathInfo);
  } else {
    // if readme
    const readme = data.children.filter((each) => isReadme(each.filename));

    if (readme.length > 0) {
      const readmeInfo = resolvePathInfo(root, readme[0].relativePath);

      data.reading = await readMarkdown(remark, readmeInfo);
    }
  }

  return data;
}
