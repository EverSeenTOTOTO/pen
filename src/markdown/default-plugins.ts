import mditHighlightjs from 'markdown-it-highlightjs';
import mditAnchor from 'markdown-it-anchor';
import mditToc from 'markdown-it-toc-done-right';
import mditFootnote from 'markdown-it-footnote';
import mditContainer from 'markdown-it-container';
import mditKatex from './plugins/katex';
import mditMermaid from './plugins/mermaid';
import mditCopy from './plugins/copy';

const createRender = (color: string) => (tokens: any, index: number) => {
  // const info = tokens[index].info.trim().slice(color.length).trim();
  return tokens[index].nesting === 1
    ? `<div class="container container-${color}">`
    : '</div>';
};

export default [
  [mditHighlightjs],
  [mditFootnote],
  [mditAnchor],
  [mditToc],
  [mditKatex, {
    throwOnError: false,
    strict: false,
  }],
  [mditMermaid],
  [mditCopy],
  [mditContainer, 'Warn', {
    render: createRender('warn'),
  }],
  [mditContainer, 'Info', {
    render: createRender('info'),
  }],
  [mditContainer, 'Error', {
    render: createRender('error'),
  }],
];
