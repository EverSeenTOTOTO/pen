import { SocketStore } from '@/store/modules/socket';
import type { AppStore } from '@/store';

const createStore = (namespace = '/') => {
  const store = new SocketStore({} as unknown as AppStore);
  store.namespace = namespace;

  return store;
};

it('keeps previewable files free of a trailing slash', () => {
  const socket = createStore();

  expect(socket.resolveRelativePath('/src/App.tsx')).toBe('/src/App.tsx');
  expect(socket.resolveRelativePath('/config.toml')).toBe('/config.toml');
  expect(socket.resolveRelativePath('/notebook/day1.md')).toBe('/notebook/day1.md');
});

it('appends the trailing slash to directories', () => {
  const socket = createStore();

  expect(socket.resolveRelativePath('/notebook')).toBe('/notebook/');
  expect(socket.resolveRelativePath('/src')).toBe('/src/');
});

it('prefixes the namespace', () => {
  const socket = createStore('/docs');

  expect(socket.resolveRelativePath('/src/App.tsx')).toBe('/docs/src/App.tsx');
  expect(socket.resolveRelativePath('/notebook')).toBe('/docs/notebook/');
});
