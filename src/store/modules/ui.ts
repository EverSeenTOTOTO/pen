import { makeAutoObservable } from 'mobx';
import { AlertColor } from '@mui/lab/Alert';
import type { AppStore } from '..';

export class UiStore {
  root: AppStore;

  severity: AlertColor = 'info';

  message = '';

  constructor(root: AppStore) {
    makeAutoObservable(this);
    this.root = root;
  }

  notify(severity: AlertColor, message: string) {
    this.severity = severity;
    this.message = message;
  }

  get breadcrumb() {
    if (!this.root.home.reading || this.root.home.reading === '/') return [];

    const split = this.root.home.reading.split('/').slice(1);
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
