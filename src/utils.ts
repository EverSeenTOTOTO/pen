import path from 'path';
import fs from 'fs';
import { PathInfo } from './types';

// forked from 'slash'
export function slash(p: string) {
  const isExtendedLengthPath = /^\\\\\?\\/.test(p);
  const hasNonAscii = /[^\u0000-\u0080]+/.test(p); // eslint-disable-line no-control-regex

  if (isExtendedLengthPath || hasNonAscii) {
    return p;
  }

  return p.replace(/\\/g, '/');
}

export function isDir(fullpath: string) {
  if (!fs.existsSync(fullpath)) return false;

  const stat = fs.statSync(fullpath);
  return stat.isDirectory();
}

export function isMarkdown(filepath: string) {
  return /\.(md|markdown)$/i.test(filepath);
}

export function isReadme(filepath: string) {
  return /README\.md$/i.test(filepath);
}

// '/a/' -> '/a'
// '/a/b/' -> '/a/b'
// '\\' -> '/'
// '\\\\' -> '/'
// '//' -> '/'
// '' -> '/'
export function formatRelative(p: string) {
  return slash(p)
    .replace(/^(.*?)\/*$/g, '$1')
    .replace(/^(?!\/)(.*)$/g, '/$1')
    .replace(/\/\//g, '/')
    .replace(/^$/, '/');
}

export function resolvePathInfo(root: string, relative: string):PathInfo {
  const fullpath = slash(path.join(root, relative.replace(/~$/, '')));
  const filename = path.basename(fullpath);
  const relativePath = formatRelative(path.relative(root, fullpath));

  return {
    fullpath,
    filename,
    relativePath,
    // eslint-disable-next-line no-nested-ternary
    type: isDir(fullpath) ? 'directory' : isMarkdown(fullpath) ? 'markdown' : 'other',
  };
}

export const stripNamespace = (namespace: string, pathname: string) => decodeURIComponent(formatRelative(pathname.replace(new RegExp(`^${namespace}`), '')));

export const createMarkup = (__html: string) => ({ __html });

export const uuid = () => `UUID${String(Math.random()).replace(/0?\./, '').slice(0, 8)}`;
