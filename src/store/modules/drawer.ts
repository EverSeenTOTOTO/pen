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

  // eslint-disable-next-line class-methods-use-this
  get toc() {
    return {
      name: 'top',
      children: [
        {
          name: 'level1',
          children: [
            {
              name: 'level2',
              children: [],
            },
          ],
        },
        {
          name: 'level1.1',
          children: [
            {
              name: 'level2.1',
              children: [
                {
                  name: 'level3.1',
                  children: [],
                },
              ],
            },
          ],
        },
      ],
    };
  }

  get childDocs() {
    const data = this.root.home?.data;

    return data?.type === 'directory'
      ? data.children
      : [];
  }
}
