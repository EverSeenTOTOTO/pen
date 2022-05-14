import { ThemeOptions } from '@material-ui/core';

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

export const themes: { [k in string]: ThemeOptions } = {
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
