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
    secondary: {
      light: '#d3b8ae',
      main: '#a1887f',
      dark: '#725b53',
      contrastText: '#fafafa',
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

const readThemeCss = (dist: string, name: keyof typeof themes) => {
  try {
    return fs.readFileSync(path.join(dist, `theme.${name}.css`), 'utf8');
  } catch (e) {
    return '';
  }
};

const globalId: string = uuid();

export const createTheme = (name: keyof typeof themes, dist?: string): PenTheme => ({
  name,
  options: themes[name],
  avaliable: Object.keys(themes),
  id: globalId,
  css: dist ? readThemeCss(dist, name) : '',
});
