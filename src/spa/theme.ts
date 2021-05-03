/* eslint-disable import/no-extraneous-dependencies */
import { useEffect, useState } from 'react';
import useMediaQuery from '@material-ui/core/useMediaQuery';

import { createMuiTheme, ThemeOptions } from '@material-ui/core/styles';

const defaultTheme: ThemeOptions = {
  palette: {
    primary: {
      light: '#d3b8ae',
      main: '#a1887f',
      dark: '#725b53',
      contrastText: '#fafafa',
    },
    secondary: {
      light: '#c1d5e0',
      main: '#90a4ae',
      dark: '#62757f',
      contrastText: '#e3f2fd',
    },
  },
};

export default () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [theme, setTheme] = useState<ThemeOptions>(() => createMuiTheme(defaultTheme));

  useEffect(() => {
    setTheme(createMuiTheme({
      ...defaultTheme,
      palette: {
        ...defaultTheme.palette,
        type: prefersDarkMode ? 'dark' : 'light',
      },
    }));
  }, [prefersDarkMode]);

  return [theme, setTheme];
};
