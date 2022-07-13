import { DocToc } from '@/types';
import { makeAutoObservable, autorun } from 'mobx';
import type { AppStore } from '..';

export class DrawerStore {
  visible = true;

  root: AppStore;

  expandedToc: string[] = [];

  constructor(root: AppStore) {
    makeAutoObservable(this);
    this.root = root;

    autorun(() => this.expandToc(this.root.home.data?.reading?.toc ?? []));
  }

  toggle(value?: boolean) {
    this.visible = value !== undefined ? value : !this.visible;
  }

  get toc() {
    return this.root.home.data?.reading?.toc ?? [];
  }

  expandToc(tocs: DocToc[]) {
    if (tocs.length === 0) {
      this.expandedToc = [];
    } else {
      const result: string[] = [];
      const push = (toc: DocToc) => {
        if (toc.children.length > 0) {
          result.push(toc.id);
          toc.children.forEach(push);
        }
      };

      push(tocs[0]);

      this.expandedToc = result;
    }
  }

  setExpandedToc(value: string[]) {
    this.expandedToc = value;
  }

  get childDocs() {
    const { data } = this.root.home;

    return data?.children.map((each) => ({ ...each, relativePath: this.root.socket.computePath(each.relativePath) })) ?? [];
  }
}
