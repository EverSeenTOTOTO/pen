import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import type { PathInfo } from './types';

export function PASS() { }

// forked from 'slash'
export function slash(p: string) {
  const isExtendedLengthPath = /^\\\\\?\\/.test(p);

  if (isExtendedLengthPath) {
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
  return /(README|index)\.(md|markdown)$/i.test(filepath);
}

// '\\' -> '/'
// '\\\\' -> '/'
// '//' -> '/'
// '' -> '/'
export function formatRelative(p: string) {
  return slash(p)
    .replace(/^(?!\/)(.*)$/g, '/$1')
    .replace(/\/\//g, '/')
    .replace(/^$/, '/');
}

export function formatDirPath(p: string) {
  return p.replace(/([^/])$/, '$1/');
}

export function resolvePathInfo(root: string, relative: string): PathInfo {
  const fullpath = slash(path.join(root, relative.replace(/~$/, '')));
  const filename = path.basename(fullpath);
  const relativePath = formatRelative(path.relative(root, fullpath));
  const isDirectory = isDir(fullpath);

  return {
    fullpath,
    filename,
    relativePath: isDirectory ? formatDirPath(relativePath) : relativePath,
    // eslint-disable-next-line no-nested-ternary
    type: isDirectory ? 'directory' : isMarkdown(fullpath) ? 'markdown' : 'other',
  };
}

export const stripNamespace = (namespace: string, pathname: string) => formatRelative(pathname.replace(new RegExp(`^${namespace}`), ''));

export const createMarkup = (__html: string) => ({ __html });

export const uuid = (content?: string) => {
  // avoid bundle error
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  const hash = crypto.createHash('sha256');

  return hash.update(content ?? 'pen').digest('hex').slice(0, 16);
};

export const perf = globalThis.performance && new Proxy(performance, {
  get(t, p, r) {
    const result = Reflect.get(t, p, r);

    if (typeof result === 'function') {
      if (process.env.NODE_ENV !== 'development') {
        return PASS;
      }

      if (p === 'measure') {
        return (...args: unknown[]) => {
          const record = result(...args);

          console.log(`${record.name}: ${record.duration}`);
        };
      }
    }

    return result;
  },
});
