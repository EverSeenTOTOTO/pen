// eslint-disable-next-line import/no-extraneous-dependencies
import { createTheme, ThemeOptions } from '@material-ui/core/styles';
import { makeAutoObservable, reaction } from 'mobx';
import RootStore from './root';

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

export const DefaultThemeConfig = {
  dark: {
    darkMode: true,
    codeStyle: 'github-dark',
  },
  light: {
    darkMode: false,
    codeStyle: 'github',
  },
};

export default class UIStore {
  rootStore: RootStore;

  drawerOpened = false;

  darkMode = false;

  errorMessage = '';

  themeStyleScript = '';

  constructor(rootStore: RootStore) {
    makeAutoObservable(this);
    this.rootStore = rootStore;

    reaction(() => this.theme, () => {
      this.rootStore.socketStore.fetchTheme(
        this.darkMode
          ? DefaultThemeConfig.dark
          : DefaultThemeConfig.light,
      );
    });
  }

  toggleDrawer(value?: boolean) {
    this.drawerOpened = value !== undefined
      ? value
      : !this.drawerOpened;
  }

  toggleDarkMode(mode?: boolean) {
    this.darkMode = mode !== undefined
      ? mode
      : !this.darkMode;
  }

  get theme() {
    return createTheme({
      ...defaultTheme,
      palette: {
        ...defaultTheme.palette,
        type: this.darkMode ? 'dark' : 'light',
        background: this.darkMode
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

  updateTheme(theme: string) {
    this.themeStyleScript = theme;
    this.rootStore.blogStore.initMermaid();
  }

  notifyError(error: Error) {
    this.errorMessage = error.message;
  }

  resetError() {
    this.errorMessage = '';
  }
}
