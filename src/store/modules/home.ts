/* eslint-disable no-nested-ternary */
import { makeAutoObservable } from 'mobx';
import { Color } from '@material-ui/lab/Alert';
import {
  ClientEvents, PenDirectoryData, PenErrorData,
} from '@/types';
import type { AppStore, PrefetchStore } from '..';

export type HomeState = {
  data?: PenDirectoryData | PenErrorData;
};

export class HomeStore implements PrefetchStore<HomeState> {
  data?: PenDirectoryData | PenErrorData;

  loading = false;

  timeoutId?: NodeJS.Timeout | number;

  root: AppStore;

  severity: Color = 'info';

  message = '';

  constructor(root: AppStore) {
    makeAutoObservable(this);
    this.root = root;
  }

  static getReadingPath(data: HomeState['data']) {
    return data?.type === 'directory'
      ? data?.reading
        ? data.reading?.relativePath
        : data.relativePath
      : undefined;
  }

  get reading() {
    return HomeStore.getReadingPath(this.data);
  }

  get html() {
    return this.data?.type === 'error'
      ? this.data?.message
      : this.data?.type === 'directory'
        ? this.data?.reading
          ? this.data?.reading?.content
          : ''
        : '';
  }

  get breadcrumb() {
    if (!this.reading || this.reading === '/') return [];
    const split = this.reading.split('/').slice(1);
    const result = [];

    for (let i = 0; i < split.length; ++i) {
      const path = `/${split.slice(0, i + 1).join('/')}`;

      result.push({
        filename: split[i],
        relative: `${this.root.socket.computePath(path)}`,
      });
    }
    return result;
  }

  fetchData(relative: string, loading = true) {
    if (loading) {
      this.timeoutId = setTimeout(() => {
        this.loading = true;
      }, 300);
    }
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
