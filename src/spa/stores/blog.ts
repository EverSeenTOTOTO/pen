import mermaid from 'mermaid';
import { makeAutoObservable, reaction } from 'mobx';
import type { FileInfo } from '../../watcher';
import RootStore from './root';

export default class BlogStore {
  rootStore: RootStore;

  files: FileInfo[] = [];

  content = '';

  current = '';

  localCurrent = -1;

  constructor(rootStore: RootStore) {
    makeAutoObservable(this);
    this.rootStore = rootStore;

    reaction(() => this.files, this.refreshLocalCurrent.bind(this));
    reaction(() => this.current, this.refreshLocalCurrent.bind(this));
  }

  reset() {
    this.current = '';
    this.content = '';
    this.files = [];
    this.localCurrent = -1;
  }

  updatePenData(data: string) {
    try {
      const result = JSON.parse(data);

      this.content = result.content;
      this.files = result.files;
      this.current = result.current;

      this.rootStore.uiStore.toggleDrawer(result.type === 'dir');
      this.initMermaid();
    } catch (error) {
      this.rootStore.uiStore.notify('error', error.message);
    }
  }

  updatePenError(data: string) {
    this.content = data;
  }

  refreshLocalCurrent() {
    const idx = this.files.findIndex((each) => each.filename === this.current);

    this.localCurrent = idx >= this.files.length ? 0 : idx;
  }

  decreaseLocalCurrent() {
    const idx = this.localCurrent - 1;

    this.localCurrent = Number.isNaN(idx)
      ? 0
      : idx < 0
        ? this.files.length - 1
        : idx;
  }

  increaseLocalCurrent() {
    const idx = this.localCurrent + 1;

    this.localCurrent = Number.isNaN(idx)
      ? 0
      : idx >= this.files.length
        ? 0
        : idx;
  }

  initMermaid() {
    const { darkMode } = this.rootStore.uiStore;

    const mermaidThemes = ['default'];
    requestAnimationFrame(() => {
      mermaid.initialize({
      // startOnLoad: true,
        theme: darkMode ? 'dark' : mermaidThemes[Math.floor(Math.random() * mermaidThemes.length)],
        gantt: {
          axisFormatter: [
            ['%Y-%m-%d', (d) => {
              return d.getDay() === 1;
            }],
          ],
        },
        sequence: {
          showSequenceNumbers: true,
        },
      });
      mermaid.init();
    });
  }
}
