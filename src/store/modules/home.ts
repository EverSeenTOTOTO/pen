import { makeAutoObservable } from 'mobx';
import { Color } from '@material-ui/lab/Alert';
import { PenDirectoryData, PenMarkdownData } from '@/types';
import type { AppStore, PrefetchStore } from '..';

export type HomeState = {
  data?: PenDirectoryData | PenMarkdownData;
};

export class HomeStore implements PrefetchStore<HomeState> {
  data?: PenDirectoryData | PenMarkdownData;

  root: AppStore;

  severity: Color = 'info';

  message = '';

  constructor(root: AppStore) {
    makeAutoObservable(this);
    this.root = root;
  }

  get html() {
    if (this.data?.type === 'directory') {
      if (this.data.reading !== undefined) {
        return this.data.reading.content;
      }

      if (this.data.readme !== undefined) {
        return this.data.readme.content;
      }
    }

    if (this.data?.type === 'markdown') {
      return this.data.content;
    }

    return '';
  }

  notify(severity: Color, message: string) {
    this.severity = severity;
    this.message = message;
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
