import { UiStore } from '@/store/modules/ui';
import type { AppStore } from '@/store';

const createRoot = (reading?: string) => ({
  home: { reading },
  socket: { resolveRelativePath: (p: string) => p },
}) as unknown as AppStore;

it('directory reading with trailing slash yields one crumb per real segment', () => {
  // regression: the trailing slash used to split into an empty segment whose
  // crumb duplicated its sibling's react key (dom node leak per navigation)
  const ui = new UiStore(createRoot('/notebook/'));

  expect(ui.breadcrumb).toEqual([{ filename: 'notebook', relative: '/notebook' }]);
});

it('markdown reading yields nested crumbs', () => {
  const ui = new UiStore(createRoot('/notebook/day1.md'));

  expect(ui.breadcrumb.map((c) => c.filename)).toEqual(['notebook', 'day1.md']);
});

it('root reading yields no crumbs', () => {
  const ui = new UiStore(createRoot('/'));

  expect(ui.breadcrumb).toEqual([]);
});
