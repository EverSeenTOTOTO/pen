import { makeAutoObservable } from 'mobx';
import { createTheme, ThemeOptions } from '@material-ui/core/styles';
import { ClientEvents, PenTheme } from '@/types';
import type { AppStore, PrefetchStore } from '..';

export class ThemeStore implements PrefetchStore<PenTheme> {
  name: string = ''

  id: string = ''

  css: string = ''

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

  saveMemory() {
    this.css = '';
  }

  hydrate(state: PenTheme): void {
    this.id = state.id;
    this.css = state.css;
    this.name = state.name;
    this.options = state.options;
    this.avaliable = state.avaliable;
  }

  dehydra() {
    return {
      id: this.id,
      css: this.css,
      name: this.name,
      options: this.options,
      avaliable: this.avaliable,
    };
  }
}
