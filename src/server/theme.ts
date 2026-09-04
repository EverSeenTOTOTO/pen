import path from 'path';
import fs from 'fs';
import type { PenTheme, ThemeNames } from '../types';

const readNothrow = (dist: string, file: string) =>
  fs.promises.readFile(path.join(dist, file), 'utf8').catch(() => '');

export const THEMES: ThemeNames[] = ['dark', 'light'];

export const isThemeName = (v: unknown): v is ThemeNames =>
  typeof v === 'string' && THEMES.includes(v as ThemeNames);

/** theme-specific <link> tags injected into the SSR template */
export const themeLinks = (name: ThemeNames): string => [
  `<link id="pen-markdown-css" rel="stylesheet" href="/assets/github-markdown-${name}.css">`,
  `<link id="pen-hljs-css" rel="stylesheet" href="/assets/highlightjs-github-${name}.css">`,
].join('\n');

export const createTheme = async (name: ThemeNames, dist?: string): Promise<PenTheme> => {
  const css = dist ? await readNothrow(dist, `assets/pen-app-${name}.css`) : '';
  return { name, css, links: themeLinks(name), avaliable: THEMES };
};
