import fs from 'fs';

function slash(p: string) {
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
export function formatPath(p: string) {
  return slash(p)
    .replace(/^(.*?)\/*$/g, '$1')
    .replace(/^(?!\/)(.*)$/g, '/$1')
    .replace(/\/\//g, '/')
    .replace(/^$/, '/');
}

export const stripNamespace = (namespace: string, pathname: string) => decodeURIComponent(formatPath(pathname.replace(new RegExp(`^${namespace}`), '')));

export const createMarkup = (__html: string) => ({ __html });

export const uuid = () => `UUID${String(Math.random()).replace(/0?\./, '').slice(0, 8)}`;
