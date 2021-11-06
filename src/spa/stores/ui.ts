// eslint-disable-next-line import/no-extraneous-dependencies
import { createTheme, ThemeOptions } from '@material-ui/core/styles';
import { makeAutoObservable } from 'mobx';
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

export default class UIStore {
  rootStore: RootStore;

  drawerOpened = false;

  darkMode = false;

  errorMessage = '';

  constructor(rootStore: RootStore) {
    makeAutoObservable(this);
    this.rootStore = rootStore;
  }

  toggleDrawer(value?: boolean) {
    this.drawerOpened = value !== undefined
      ? value
      : !this.drawerOpened;
  }

  get theme() {
    return createTheme({
      ...defaultTheme,
      palette: {
        ...defaultTheme.palette,
        type: this.darkMode ? 'dark' : 'light',
      },
    });
  }

  notifyError(error: Error) {
    this.errorMessage = error.message;
  }

  resetError() {
    this.errorMessage = '';
  }
}
