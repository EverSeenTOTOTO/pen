import { makeAutoObservable, reaction } from 'mobx';
import { setCookieJson } from '@/cookie';
import type { AppStore } from '..';

export class Cookie {
  root: AppStore;

  constructor(root: AppStore) {
    makeAutoObservable(this);
    this.root = root;

    reaction(() => this.data, () => this.save());
  }

  protected save() {
    if (globalThis.document) {
      Object.entries(this.data).forEach(([key, value]) => {
        setCookieJson(key, value);
      });

      if (import.meta.env.DEV) {
        console.log(document.cookie);
      }
    }
  }

  get data(): Record<string, unknown> {
    return {
      drawerVisible: this.root.drawer.visible,
      themeMode: this.root.theme.mode,
    };
  }
}
