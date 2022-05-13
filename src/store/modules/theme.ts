import { makeAutoObservable } from 'mobx';
import { createTheme, ThemeOptions } from '@material-ui/core/styles';
import type { AppStore, PrefetchStore } from '..';

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

export type ThemeState = {
  dark: boolean
};

export class ThemeStore implements PrefetchStore<ThemeState> {
  dark = false;

  root: AppStore;

  constructor(root: AppStore) {
    makeAutoObservable(this);
    this.root = root;
  }

  toggleDark(value?: boolean) {
    this.dark = value ?? !this.dark;
  }

  get theme() {
    return createTheme({
      ...defaultTheme,
      palette: {
        ...defaultTheme.palette,
        type: this.dark ? 'dark' : 'light',
        background: this.dark
          ? {
            paper: '#0d1117',
            default: '#0d1117',
          } : {
            paper: '#fff',
            default: '#fff',
          },
      },
    });
  }

  hydrate(state: ThemeState): void {
    this.dark = state.dark;
  }

  dehydra(): ThemeState {
    return {
      dark: this.dark,
    };
  }
}
