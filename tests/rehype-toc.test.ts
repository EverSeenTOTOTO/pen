import { describe, it, expect } from 'vitest';
import { h } from 'hastscript';
import type { Element, Root } from 'hast';
import { VFile } from 'vfile';
import type { DocToc } from '@/types';
import { rehypeSlugToc, PEN_TOC_DATA } from '@/server/plugins/rehype-toc';

const run = (tree: ReturnType<typeof h>) => {
  const file = new VFile();
  rehypeSlugToc()(tree as unknown as Root, file);
  return { tree, toc: file.data[PEN_TOC_DATA] as DocToc[] };
};

const idAt = (tree: ReturnType<typeof h>, index: number) => (tree.children[index] as Element).properties.id;

describe('rehypeSlugToc', () => {
  it('slugs headings and collects toc in document order', () => {
    const { tree, toc } = run(h('div', [
      h('h1', 'Hello World'),
      h('h2', '中文标题'),
      h('h3', 'Nested'),
    ]));
    expect(idAt(tree, 0)).toBe('hello-world');
    expect(idAt(tree, 1)).toBe('中文标题');
    expect(toc).toEqual([
      { id: 'hello-world', text: 'Hello World', heading: 1, children: [
        { id: '中文标题', text: '中文标题', heading: 2, children: [
          { id: 'nested', text: 'Nested', heading: 3, children: [] },
        ] },
      ] },
    ]);
  });

  it('deduplicates repeated headings github-style', () => {
    const { tree } = run(h('div', [h('h2', 'Same'), h('h2', 'Same')]));
    expect(idAt(tree, 0)).toBe('same');
    expect(idAt(tree, 1)).toBe('same-1');
  });

  it('handles sibling heading level jumps', () => {
    const { toc } = run(h('div', [h('h1', 'A'), h('h3', 'B'), h('h2', 'C')]));
    expect(toc[0].children.map((c) => c.text)).toEqual(['B', 'C']);
  });

  it('resets slug uniqueness per run', () => {
    run(h('div', [h('h2', 'Dup')]));
    const b = run(h('div', [h('h2', 'Dup')]));
    expect(idAt(b.tree, 0)).toBe('dup');
  });
});
