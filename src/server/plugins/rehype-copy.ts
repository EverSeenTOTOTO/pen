/* eslint-disable @typescript-eslint/no-explicit-any */
import { h } from 'hastscript';
import { makeCodeBlockPlugin } from './code-block';

export default makeCodeBlockPlugin((lang: string | undefined, code: any, pre: any, idx: number, parent: any) => {
  const codes = code.children.filter((each: any) => each.type === 'text');
  const text = codes.length > 0 ? codes[0].value : '';

  const button = h(
    'button',
    {
      class: 'copy-btn',
      'data-clipboard-text': text,
    },
    [
      h(
        'span',
        lang ?? 'copy',
      ),
    ],
  );

  const div = h(
    'div',
    {
      class: 'copy-btn-container',
    },
    [
      pre,
      button,
    ],
  );

  parent.children.splice(idx, 1, div);
});
