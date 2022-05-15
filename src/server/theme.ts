import path from 'path';
import fs from 'fs';
import { ThemeOptions } from '@material-ui/core';
import { uuid } from '../utils';
import { PenTheme } from '../types';

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

const readThemeCss = async (dist: string, name: keyof typeof themes) => {
  try {
    const csses = await Promise.all([
      fs.promises.readFile(path.join(dist, `assets/theme.${name}.css`), 'utf8'),
      fs.promises.readFile(path.join(dist, `assets/github-markdown-${name}.css`), 'utf8'),
    ]);

    return csses.reduce((p, c) => `${p}\n${c}`);
  } catch (e) {
    return '';
  }
};

const globalId: string = uuid();

export const createTheme = async (name: keyof typeof themes, dist?: string): Promise<PenTheme> => ({
  name,
  options: themes[name],
  avaliable: Object.keys(themes),
  id: globalId,
  css: dist ? await readThemeCss(dist, name) : '',
});
