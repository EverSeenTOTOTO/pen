import path from 'path';
import fs from 'fs';
import deepmerge from 'deepmerge';
import { ThemeOptions } from '@mui/material/styles';
import { uuid } from '../utils';
import { PenTheme } from '../types';

const defaultTheme: ThemeOptions = {
  palette: {
    primary: {
      light: '#c1d5e0',
      main: '#90a4ae',
      dark: '#62757f',
      contrastText: '#e3f2fd',
    },
  },
  components: {
    // migration from MUI@v4 to v5
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontSize: '0.875rem',
          lineHeight: 1.43,
          letterSpacing: '0.01071em',
        },
      },
    },
    MuiLink: {
      defaultProps: {
        underline: 'hover',
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'unset',
        },
      },
    },
  },
};

const themes: { [k in 'dark' | 'light']: ThemeOptions } = {
  dark: deepmerge(defaultTheme, {
    palette: {
      mode: 'dark',
      background: {
        paper: '#0d1117',
        default: '#0d1117',
      },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            color: 'rgba(255 255 255 / 80%)',
          },
        },
      },
    },
  }),
  light: deepmerge(defaultTheme, {
    palette: {
      mode: 'light',
      background: {
        paper: '#fff',
        default: '#fff',
      },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            color: 'rgba(0 0 0 / 70%)',
          },
        },
      },
    },
  }),
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

export type ThemeNames = keyof typeof themes;

export const createTheme = async (name: ThemeNames, dist?: string): Promise<PenTheme> => {
  const css = dist ? await readThemeCss(dist, name) : '';

  return {
    css,
    name,
    options: themes[name],
    avaliable: Object.keys(themes),
    id: globalId,
  };
};
