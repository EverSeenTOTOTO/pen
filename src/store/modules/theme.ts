import { makeAutoObservable } from 'mobx';
import { createTheme, ThemeOptions } from '@material-ui/core/styles';
import { ClientEvents, PenTheme } from '@/types';
import type { AppStore, PrefetchStore } from '..';

type ThemeState = Omit<PenTheme, 'css'>;

export class ThemeStore implements PrefetchStore<ThemeState> {
  name: string = ''

  id: string = ''

  avaliable: string[] = []

  options:ThemeOptions = {};

  root: AppStore;

  constructor(root: AppStore) {
    makeAutoObservable(this);
    this.root = root;
  }

  get theme() {
    return createTheme(this.options);
  }

  get dark() {
    return this.options.palette?.type === 'dark';
  }

  changeTheme(name: string) {
    this.root.socket.emit(ClientEvents.FetchStyle, name);
  }

  hydrate(state: PenTheme): void {
    this.id = state.id;
    this.name = state.name;
    this.options = state.options;
    this.avaliable = state.avaliable;

    if (globalThis.document && this.id.startsWith('UUID') && typeof state.css === 'string') {
      const styleElement = globalThis.document.getElementById(this.id);

      if (styleElement) {
        styleElement.innerHTML = state.css;
      }
    }
  }

  dehydra() {
    return {
      id: this.id,
      name: this.name,
      options: this.options,
      avaliable: this.avaliable,
    };
  }
}
