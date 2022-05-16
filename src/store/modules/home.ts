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
    const reading = this.data?.type === 'markdown'
      ? this.data?.relativePath
      : this.data?.type === 'directory'
        ? this.data?.reading
          ? this.data.reading?.relativePath
          : this.data.relativePath
        : undefined;

    if (!reading || reading === '/') return [];
    const split = reading.split('/').slice(1);
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
    this.data = state.data;

    this.loading = false;
    clearTimeout(this.timeoutId as number);
    if (globalThis && globalThis.scrollTo) {
      globalThis.scrollTo(0, 0);
    }
  }

  dehydra(): HomeState {
    return {
      data: this.data,
    };
  }
}
