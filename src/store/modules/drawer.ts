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
    this.visible = value !== undefined ? value : !this.visible;
  }

  get toc() {
    const data = this.root.home?.data;

    // eslint-disable-next-line no-nested-ternary
    const toc = data?.type === 'directory'
      ? data.reading?.toc
      : data?.type === 'markdown'
        ? data?.toc
        : undefined;

    return toc ?? [];
  }

  get expandedToc() {
    if (this.toc.length === 0) return [];

    const tocs: string[] = [];

    const push = (toc: DocToc) => {
      if (toc.children.length > 0) {
        tocs.push(toc.id);
        toc.children.forEach(push);
      }
    };

    push(this.toc[0]);

    return tocs;
  }

  get childDocs() {
    const data = this.root.home?.data;

    return data?.type === 'directory'
      ? data.children.map((each) => ({ ...each, relativePath: `${this.root.socket.computePath(each.relativePath)}` }))
      : [];
  }
}
