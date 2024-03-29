import { createContext, useContext } from 'react';
import { HomeStore } from './modules/home';
import { DrawerStore } from './modules/drawer';
import { ThemeStore } from './modules/theme';
import { SocketStore } from './modules/socket';
import { UiStore } from './modules/ui';
import { Cookie } from './modules/cookie';

export type PrefetchStore<State> = {
  // merge ssr prefetched data
  hydrate(state: State): void;
  // provide ssr prefetched data
  dehydra(): State | undefined;
};

type PickKeys<T> = {
  [K in keyof T]: T[K] extends PrefetchStore<unknown> ? K : never
}[keyof T];

export class AppStore {
  home: HomeStore;

  drawer: DrawerStore;

  theme: ThemeStore;

  socket: SocketStore;

  ui: UiStore;

  cookie: Cookie;

  constructor() {
    this.home = new HomeStore(this);
    this.drawer = new DrawerStore(this);
    this.theme = new ThemeStore(this);
    this.socket = new SocketStore(this);
    this.ui = new UiStore(this);
    this.cookie = new Cookie(this);
  }

  hydrate(data: Record<string, unknown>) {
    Object.keys(data).forEach((key) => {
      const k = key as PickKeys<AppStore>;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (data[k]) this[k]?.hydrate?.(data[k] as any);
    });
  }

  dehydra() {
    type Data = Record<PickKeys<AppStore>, unknown>;
    const data: Partial<Data> = {};

    Object.keys(this).forEach((key) => {
      const k = key as PickKeys<AppStore>;

      data[k] = this[k]?.dehydra?.();
    });

    return data as Data;
  }
}

const appStore = new AppStore();

export const createStore = () => appStore;
export const RootContext = createContext<AppStore>(appStore);
export const useStore = <T extends keyof AppStore>(key: T): AppStore[T] => {
  const root = useContext(RootContext);

  return root[key];
};
