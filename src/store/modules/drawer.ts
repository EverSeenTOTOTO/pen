import { DocToc } from '@/types';
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
    return { name: 'TODO', children: [] };
  }

  get expandedToc() {
    const tocs: string[] = [];

    const push = (toc: DocToc) => {
      if (toc.children.length > 0) {
        tocs.push(toc.name);
        toc.children.forEach(push);
      }
    };

    push(this.toc);

    return tocs;
  }

  get childDocs() {
    const data = this.root.home?.data;

    return data?.type === 'directory'
      ? data.children
      : [];
  }
}
