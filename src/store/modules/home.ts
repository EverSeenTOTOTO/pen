import { makeAutoObservable } from 'mobx';
import { PenData } from '@/types';
import type { AppStore, PrefetchStore } from '..';

export type HomeState = {
  data?: PenData
};

export class HomeStore implements PrefetchStore<HomeState> {
  data?: PenData;

  root: AppStore;

  constructor(root: AppStore) {
    makeAutoObservable(this);
    this.root = root;
  }

  get html() {
    if (this.data?.type === 'directory') {
      if (this.data.reading !== undefined) {
        return this.data.reading.content;
      } if (this.data.readme !== undefined) {
        return this.data.readme.content;
      }
      return '';
    } if (this.data?.type === 'markdown') {
      return this.data.content;
    }
    return this.data?.message ?? '';
  }

  hydrate(state: HomeState): void {
    this.data = state.data;
  }

  dehydra(): HomeState {
    return {
      data: this.data,
    };
  }
}
