/* eslint-disable @typescript-eslint/no-explicit-any */
import { h } from 'hastscript';
import { makeCodeBlockPlugin } from './code-block';

export default makeCodeBlockPlugin((lang: string | undefined, node: any, _: number, parent: any) => {
  const codes = node.children.filter((each: any) => each.type === 'text');
  const code = codes.length > 0 ? codes[0].value : '';

  const button = h(
    'button',
    {
      class: 'copy-btn',
      'data-clipboard-text': code,
    },
    [
      h(
        'span',
        lang ?? 'copy',
      ),
    ],
  );

  parent.children.push(button);
});
