 
import { makeAutoObservable } from 'mobx';
import { ClientEvents } from '@/types';
import type { PenDirectoryData, PenErrorData } from '@/types';
import { LRUCache } from 'lru-cache';
import type { AppStore, PrefetchStore } from '..';

export type HomeState = {
  data?: PenDirectoryData | PenErrorData;
};

// byte-bounded: approximate entry size as character count * 2 (utf-16 code
// units), plus a fixed overhead for path/metadata
const cache = new LRUCache<string, PenDirectoryData | PenErrorData>({
  maxSize: 8 * 1024 * 1024,
  sizeCalculation: (value) => {
    const reading = 'reading' in value && value.reading ? value.reading.content.length : 0;
    const content = 'content' in value ? String((value as { content: unknown }).content).length : 0;
    return (content + reading) * 2 + 2048;
  },
});

export class HomeStore implements PrefetchStore<HomeState> {
  data?: PenDirectoryData;

  error?: PenErrorData;

  last = '/';

  loading = false;

  loadingTimeout = false;

  root: AppStore;

  timeoutId?: NodeJS.Timeout;

  constructor(root: AppStore) {
    makeAutoObservable(this);
    this.root = root;
  }

  get reading() {
    return this.data?.reading?.relativePath ?? this.data?.relativePath;
  }

  get html() {
    return decodeURIComponent(this.error
      ? this.error?.message
      : this.data?.reading
        ? this.data?.reading?.content
        : '');
  }

  fetchData(pathname: string, foreground = true) {
    const relative = this.root.socket.stripPath(decodeURIComponent(pathname));

    if (foreground && relative === this.reading) return;

    const record = cache.get(relative);

    if (!record) {
      if (foreground) {
        this.last = relative;
        this.loading = true;
        this.timeoutId = setTimeout(() => { this.loadingTimeout = true; }, 300);
      }
    } else {
      this.data = record as PenDirectoryData;
    }

    console.log(`fetch ${relative}`);

    this.error = undefined;
    this.root.socket.emit(ClientEvents.FetchData, relative);
  }

  hydrate({ data }: HomeState): void {
    if (data?.type === 'error') {
      this.error = data;
    } else {
      const reading = data?.reading?.relativePath ?? data?.relativePath;

      if (globalThis && globalThis.scrollTo && this.reading !== reading) {
        globalThis.scrollTo(0, 0);
      }

      if (this.timeoutId) clearTimeout(this.timeoutId);

      this.loading = false;
      this.loadingTimeout = false;
      this.data = data;

      if (reading !== undefined && this.data) {
        cache.set(reading, this.data);
      }
    }
  }

  dehydra(): HomeState {
    return {
      data: this.data ?? this.error,
    };
  }
}
