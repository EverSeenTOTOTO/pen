import { makeAutoObservable } from 'mobx';
import type { AppStore } from '..';

export class DrawerStore {
  visible = true;

  root: AppStore;

  constructor(root: AppStore) {
    makeAutoObservable(this);
    this.root = root;
  }

  toggle(value?: boolean) {
    this.visible = value ?? !this.visible;
  }

  get childDocs() {
    const data = this.root.home?.data;

    return data?.type === 'directory'
      ? data.children
      : [];
  }
}
