import { makeAutoObservable, reaction } from 'mobx';
import cookie from 'js-cookie';
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
      Object.keys(this.data).forEach((key) => {
        cookie.set(key, JSON.stringify(this.data[key]), { expires: 365 });
      });

      if (import.meta.env.DEV) {
        console.log(document.cookie);
      }
    }
  }

  protected load(): Cookie['data'] {
    const result = this.data; // default value

    if (globalThis.document) {
      const value = cookie.get();

      Object.keys(value).forEach((key) => {
        try {
          result[key] = JSON.parse(value[key]);
        } catch (e) {
          console.error(e);
        }
      });
    }

    return result;
  }

  get data(): Record<string, unknown> {
    return {
      drawerVisible: this.root.drawer.visible,
      themeMode: this.root.theme.mode,
    };
  }
}
