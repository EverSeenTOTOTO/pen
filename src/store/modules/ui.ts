import { makeAutoObservable } from 'mobx';
import type { AppStore } from '..';

export type Severity = 'success' | 'error' | 'info' | 'warning';

export class UiStore {
  root: AppStore;

  severity: Severity = 'info';

  message = '';

  timer?: ReturnType<typeof setTimeout>;

  constructor(root: AppStore) {
    makeAutoObservable(this);
    this.root = root;
  }

  notify(severity: Severity, message: string) {
    this.severity = severity;
    this.message = message;
    if (this.timer) clearTimeout(this.timer);
    if (message) {
      this.timer = setTimeout(() => { this.message = ''; }, 3000);
    }
  }

  get breadcrumb() {
    if (!this.root.home.reading || this.root.home.reading === '/') return [];

    // directory readings carry a trailing slash (`/docs/`) which splits into
    // an empty last segment — drop it: it renders a phantom crumb whose
    // resolved link duplicates its sibling's react key, and reconciliation
    // over the duplicate keys leaks a stale node per navigation
    const split = this.root.home.reading.split('/').slice(1).filter(Boolean);
    const result = [];

    for (let i = 0; i < split.length; ++i) {
      const path = `/${split.slice(0, i + 1).join('/')}`;

      result.push({
        filename: split[i],
        relative: `${this.root.socket.resolveRelativePath(path)}`,
      });
    }

    return result;
  }
}
