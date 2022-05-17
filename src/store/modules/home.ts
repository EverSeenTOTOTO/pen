/* eslint-disable no-nested-ternary */
import { makeAutoObservable } from 'mobx';
import { Color } from '@material-ui/lab/Alert';
import {
  ClientEvents, PenDirectoryData, PenErrorData, PenMarkdownData,
} from '@/types';
import type { AppStore, PrefetchStore } from '..';

export type HomeState = {
  data?: PenDirectoryData | PenMarkdownData | PenErrorData;
};

export class HomeStore implements PrefetchStore<HomeState> {
  data?: PenDirectoryData | PenMarkdownData | PenErrorData;

  loading = false;

  initialLoad = true;

  timeoutId?: NodeJS.Timeout | number;

  root: AppStore;

  severity: Color = 'info';

  message = '';

  constructor(root: AppStore) {
    makeAutoObservable(this);
    this.root = root;
  }

  static getReadingPath(data: HomeState['data']) {
    return data?.type === 'markdown'
      ? data?.relativePath
      : data?.type === 'directory'
        ? data?.reading
          ? data.reading?.relativePath
          : data.relativePath
        : undefined;
  }

  get reading() {
    return HomeStore.getReadingPath(this.data);
  }

  get html() {
    return this.data?.type === 'markdown'
      ? this.data.content
      : this.data?.type === 'error'
        ? this.data?.message
        : this.data?.type === 'directory'
          ? this.data?.reading
            ? this.data?.reading?.content
            : this.data?.readme
              ? this.data?.readme?.content
              : ''
          : '';
  }

  get breadcrumb() {
    if (!this.reading || this.reading === '/') return [];
    const split = this.reading.split('/').slice(1);
    const result = [];

    for (let i = 0; i < split.length; ++i) {
      result.push({
        relative: `/${split.slice(0, i + 1).join('/')}`,
        filename: split[i],
      });
    }
    return result;
  }

  fetchData(relative: string) {
    if (!this.initialLoad) {
      this.timeoutId = setTimeout(() => {
        this.loading = true;
      }, 300);
    }
    this.initialLoad = false;
    this.root.socket.emit(ClientEvents.FetchData, relative);
  }

  notify(severity: Color, message: string) {
    this.severity = severity;
    this.message = message;
  }

  hydrate(state: HomeState): void {
    if (globalThis && globalThis.scrollTo && this.reading !== HomeStore.getReadingPath(state.data)) {
      globalThis.scrollTo(0, 0);
    }
    clearTimeout(this.timeoutId as number);
    this.loading = false;
    this.data = state.data;
  }

  dehydra(): HomeState {
    return {
      data: this.data,
    };
  }
}
