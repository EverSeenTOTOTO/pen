import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { ThemeOptions } from '@material-ui/core';
import { uuid } from '../utils';
import { PenTheme } from '../types';

const createHash = (content: string) => crypto.createHash('sha256').update(content).digest('hex');

const defaultTheme = {
  palette: {
    primary: {
      light: '#c1d5e0',
      main: '#90a4ae',
      dark: '#62757f',
      contrastText: '#e3f2fd',
    },
  },
};

const themes: { [k in string]: ThemeOptions } = {
  dark: {
    ...defaultTheme,
    palette: {
      ...defaultTheme.palette,
      type: 'dark',
      background: {
        paper: '#0d1117',
        default: '#0d1117',
      },
    },
  },
  light: {
    ...defaultTheme,
    palette: {
      ...defaultTheme.palette,
      type: 'light',
      background: {
        paper: '#fff',
        default: '#fff',
      },
    },
  },
};

const readCssNothrow = (dist: string, file: string) => fs.promises.readFile(path.join(dist, file), 'utf8').catch(() => '');

const readThemeCss = async (dist: string, name: keyof typeof themes) => {
  const csses = await Promise.all([
    readCssNothrow(dist, `assets/theme.${name}.css`),
    readCssNothrow(dist, `assets/github-markdown-${name}.css`),
    readCssNothrow(dist, `assets/highlightjs-github-${name}.css`),
  ]);

  return csses.reduce((p, c) => `${p}\n${c}`);
};

const globalId: string = uuid();

export const createTheme = async (name: keyof typeof themes, dist?: string): Promise<PenTheme> => {
  const css = dist ? await readThemeCss(dist, name) : '';
  return {
    css,
    name,
    options: themes[name],
    avaliable: Object.keys(themes),
    id: globalId,
    hash: createHash(css),
  };
};
