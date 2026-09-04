import GithubSlugger from 'github-slugger';
import { visit } from 'unist-util-visit';
import { toString } from 'hast-util-to-string';
import type { Root, Element } from 'hast';
import type { VFile } from 'vfile';
import type { DocToc } from '@/types';

const HEADING_REGEXP = /^h([1-6])$/;

export const PEN_TOC_DATA = 'penToc';

/**
 * Single pass: slug every heading (github-slugger rules, CJK preserved),
 * set the id on the heading element itself and collect the toc tree into
 * file.data.penToc — replacing the old two-span hack and the second
 * full re-parse of the rendered HTML.
 */
export function rehypeSlugToc() {
  return (tree: Root, file: VFile) => {
    const slugger = new GithubSlugger(); // per file: resets uniqueness
    const root: DocToc = { id: '', text: '', heading: 0, children: [] };
    const stack: DocToc[] = [root];

    visit(tree, 'element', (node: Element) => {
      const match = typeof node.tagName === 'string' ? node.tagName.match(HEADING_REGEXP) : null;
      if (!match) return;

      const heading = Number(match[1]);
      const text = toString(node);
      const id = slugger.slug(text);

      node.properties.id = id;

      while (stack.length > 1 && heading <= stack[stack.length - 1].heading) {
        stack.pop();
      }

      const item: DocToc = { id, text, heading, children: [] };
      stack[stack.length - 1].children.push(item);
      stack.push(item);
    });

    file.data[PEN_TOC_DATA] = root.children;
  };
}
