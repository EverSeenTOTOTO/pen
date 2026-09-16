/* eslint-disable @typescript-eslint/no-explicit-any */
import { visit } from 'unist-util-visit';

/**
 * remark-frontmatter parses the leading `---` block into a `yaml` node
 * that remark-rehype then drops — the metadata would vanish from the
 * preview. Re-emit it as a fenced yaml code block so documents keep their
 * frontmatter visible, highlighted like any other fenced block.
 */
const remarkFrontmatterView = () => (tree: any) => {
  visit(tree, 'yaml', (node: any, index: number, parent: any) => {
    if (!parent || index === undefined) return;

    parent.children[index] = {
      type: 'code',
      lang: 'yaml',
      value: String(node.value ?? ''),
    };
  });
};

export default remarkFrontmatterView;
