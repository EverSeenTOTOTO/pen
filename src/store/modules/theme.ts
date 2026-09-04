import { makeAutoObservable } from 'mobx';
import type { ThemeNames } from '@/types';
import type { AppStore, PrefetchStore } from '..';

export type ThemeState = { mode: ThemeNames };

export class ThemeStore implements PrefetchStore<ThemeState> {
  mode: ThemeNames = 'dark';

  root: AppStore;

  constructor(root: AppStore) {
    makeAutoObservable(this);
    this.root = root;
  }

  changeTheme(mode: ThemeNames) {
    this.mode = mode;
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = mode;
      document.getElementById('pen-markdown-css')
        ?.setAttribute('href', `/assets/github-markdown-${mode}.css`);
      document.getElementById('pen-hljs-css')
        ?.setAttribute('href', `/assets/highlightjs-github-${mode}.css`);
    }
  }

  /**
   * Accepts either the client dehydra shape `{ mode }` (from
   * __PREFETCHED_STATE__) or the server PenTheme `{ name, ... }` (from the
   * SSR prefetch object).
   */
  hydrate(state: { mode?: ThemeNames; name?: ThemeNames }): void {
    const mode = state?.mode ?? state?.name;
    if (mode) this.changeTheme(mode);
  }

  dehydra(): ThemeState {
    return { mode: this.mode };
  }
}
