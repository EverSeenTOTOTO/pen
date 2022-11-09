/* eslint-disable @typescript-eslint/no-explicit-any */
// fork from rehype-toc
import { DocToc } from '@/types';
import { uuid } from '@/utils';
import { visit } from 'unist-util-visit';
import { h } from 'hastscript';

function isHtmlElementNode(node: any) {
  return typeof node === 'object'
    && node.type === 'element'
    && typeof node.tagName === 'string'
    && 'properties' in node
    && typeof node.properties === 'object';
}

function getHeadingNumber(node: any) {
  if (isHtmlElementNode(node)) {
    const match = /^h(?<heading>[1-6])$/.exec(node.tagName);

    if (match) {
      return Number(match.groups?.heading) ?? -1;
    }
  }
  return -1;
}

function getInnerText(node: any): string {
  let text = '';

  if (node.type === 'text') {
    text += node.value || '';
  }

  if (node.children) {
    const parent = node;
    for (const child of parent.children) {
      text += getInnerText(child);
    }
  }

  return text.trim();
}

function modifyHeader(uid: number) {
  return (node: any) => {
    const heading = getHeadingNumber(node);

    if (heading !== -1) {
      const content = getInnerText(node);
      const id = `H${uuid(content + uid)}`;
      // eslint-disable-next-line no-param-reassign
      node.children = [
        h(
          'span', // for navigate
          {
            id,
          },
        ),
        h(
          'span', // for display
          Array.isArray(node.children) ? node.children : [],
        ),
      ];
    }
  };
}

// add a unique id to each heading
export function rehypeTocId() {
  let uid = 0;
  return (tree: any) => {
    visit(tree, 'element', modifyHeader(uid++));
  };
}

/* ---- Seperator for rehypeTocId and rehypeToc ---- */

function removeParent(toc: DocToc) {
  // eslint-disable-next-line no-param-reassign
  delete toc.parent;
  toc.children.forEach(removeParent);
}

function createToc(tree: any) {
  const top: DocToc = {
    id: uuid(),
    text: 'never mind',
    children: [],
    heading: -1,
  };

  let last = top;

  function extract(node: any) {
    let parent = last;
    const heading = getHeadingNumber(node);

    if (heading !== -1) {
      // find the closest upper heading
      // 因为可能出现在DOM结构上是父子关系，但在header层级上是兄弟关系等
      while (heading <= parent.heading) {
        parent = parent.parent ?? top;
      }

      const span = node.children.filter((each: any) => each.tagName === 'span')[0];

      if (span) {
        const { id } = span.properties;

        last = {
          id, // extract out for navigation: document.getElementById(id).scrollIntoView();
          parent,
          heading,
          text: encodeURIComponent(getInnerText(node)),
          children: [],
        };

        parent.children.push(last);
      }
    } else if (Array.isArray(node.children)) {
      node.children.forEach(extract);
    }
  }

  extract(tree);
  // avoid recursive when stringify to json
  removeParent(top);

  return top.children;
}

// extract doc toc from html
export function rehypeToc() {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  this.Compiler = (tree: any): DocToc[] => createToc(tree);
}
