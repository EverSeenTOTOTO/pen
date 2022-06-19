/* eslint-disable @typescript-eslint/no-explicit-any */
// fork from rehype-toc
import { DocToc } from '@/types';
import { uuid } from '@/utils';
import { visit } from 'unist-util-visit';

function isHtmlElementNode(node: any) {
  return typeof node === 'object'
    && node.type === 'element'
    && typeof node.tagName === 'string'
    && 'properties' in node
    && typeof node.properties === 'object';
}

function getHeadingNode(node: any) {
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

function addHeadingId(node: any) {
  const heading = getHeadingNode(node);

  if (heading !== -1) {
    // eslint-disable-next-line no-param-reassign
    node.properties = {
      ...node.properties,
      id: node.properties?.id ?? `H${heading}${uuid()}`,
    };
  }
}

// add a unique id to each heading
export function rehypeTocId() {
  return (tree: any) => {
    visit(tree, 'element', addHeadingId);
  };
}

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

  function addHeadingToc(node: any) {
    let parent = last;
    const heading = getHeadingNode(node);

    if (heading !== -1) {
      // find the closest upper heading
      while (heading <= parent.heading) {
        parent = parent.parent ?? top;
      }

      const { id } = node.properties;

      last = {
        id,
        parent,
        heading,
        text: encodeURIComponent(getInnerText(node)),
        children: [],
      };

      parent.children.push(last);
    } else if (Array.isArray(node.children)) {
      node.children.forEach(addHeadingToc);
    }
  }

  addHeadingToc(tree);
  removeParent(top);

  return top.children;
}

export function rehypeToc() {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  this.Compiler = (tree: any): DocToc[] => createToc(tree);
}
