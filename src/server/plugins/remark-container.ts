/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-param-reassign */
import { visit } from 'unist-util-visit';
import { h } from 'hastscript';

export const makeContainerPlugin = (type: string[]) => () => (tree: any) => {
  const regex = new RegExp(`^${type.join('|')}$`, 'i');

  visit(tree, (node: any) => {
    if (
      node.type === 'textDirective'
      || node.type === 'leafDirective'
      || node.type === 'containerDirective'
    ) {
      if (!regex.test(node.name)) return;

      const data = node.data ?? (node.data = {});
      const tagName = node.type === 'textDirective' ? 'span' : 'div';

      data.hName = tagName;
      data.hProperties = h(tagName, { class: `container container-${node.name.toLowerCase()}` }).properties;
    }
  });
};
