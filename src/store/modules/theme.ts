import { makeAutoObservable, reaction } from 'mobx';
import { createTheme, ThemeOptions } from '@material-ui/core/styles';
import { PenTheme } from '@/types';
// TODO: socket
import { themes } from '@/server/theme';
import type { AppStore, PrefetchStore } from '..';

export class ThemeStore implements PrefetchStore<PenTheme> {
  name: string = ''

  avaliable: string[] = []

  options:ThemeOptions = {};

  root: AppStore;

  constructor(root: AppStore) {
    makeAutoObservable(this);
    this.root = root;
    reaction(() => this.name, () => {
      // TODO: fetch theme
    });
  }

  changeTheme(value: string) {
    this.name = value;
    this.options = themes[value];
  }

  get theme() {
    return createTheme(this.options);
  }

  get dark() {
    return this.options.palette?.type === 'dark';
  }

  hydrate(state: PenTheme): void {
    this.name = state.name;
    this.options = state.options;
    this.avaliable = state.avaliable;
  }

  dehydra(): PenTheme {
    return {
      name: this.name,
      options: this.options,
      avaliable: this.avaliable,
    };
  }
}
