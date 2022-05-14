import { makeAutoObservable } from 'mobx';
import { PenInitData } from '@/types';
import type { AppStore, PrefetchStore } from '..';

export class ServerInfoStore implements PrefetchStore<PenInitData> {
  availableThemes: string[] = [];

  root: string = '';

  namespace:string = '';

  rootStore: AppStore;

  constructor(root: AppStore) {
    makeAutoObservable(this);
    this.rootStore = root;
  }

  hydrate(state: PenInitData): void {
    this.root = state.root;
    this.namespace = state.namespace;
  }

  // eslint-disable-next-line class-methods-use-this
  dehydra(): PenInitData | undefined {
    return undefined;
  }
}
