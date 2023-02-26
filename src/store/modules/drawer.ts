import { makeAutoObservable, reaction } from 'mobx';
import type { AppStore } from '..';

export class DrawerStore {
  visible = false;

  root: AppStore;

  expandedToc: string[] = [];

  constructor(root: AppStore) {
    makeAutoObservable(this);
    this.root = root;

    reaction(() => this.toc, () => this.expandToc());
  }

  toggle(value?: boolean) {
    this.visible = value !== undefined ? value : !this.visible;
  }

  get toc() {
    return this.root.home.data?.reading?.toc ?? [];
  }

  protected expandToc() {
    if (this.toc[0]?.children.length > 0 && !this.expandedToc.includes(this.toc[0]?.id)) {
      this.expandedToc.push(this.toc[0].id); // expand first level
    }
  }

  setExpandedToc(value: string[]) {
    this.expandedToc = value;
  }

  get subdirs() {
    const { data } = this.root.home;

    return data?.children.map((each) => ({ ...each, relativePath: this.root.socket.resolveRelativePath(each.relativePath) })) ?? [];
  }
}
