/* eslint-disable @typescript-eslint/no-explicit-any */
import { visit } from 'unist-util-visit';

const LANGUAGE_CLASS_REGEXP = /^(?:language-|lang-)(\S+)/;

function getLanguage(node: any) {
  const className = node.properties.className || [];

  const { length } = className;
  let index = -1;
  while (++index < length) {
    const match = className[index].match(LANGUAGE_CLASS_REGEXP);
    if (match) {
      return match[1];
    }
  }

  return null;
}

export const makeCodeBlockPlugin = (callback: any) => () => (tree: any) => {
  visit(tree, 'element', (pre: any, index: number | null, parent: any) => {
    if (
      !parent
      || pre.tagName !== 'pre'
    ) {
      return;
    }

    const code = pre.children?.filter((each: any) => each.tagName === 'code')[0];

    if (!code) return;

    const lang = getLanguage(code);

    if (!lang) return;

    callback(lang, code, pre, index, parent);
  });
};
