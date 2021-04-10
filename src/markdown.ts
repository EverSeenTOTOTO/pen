import mdit from 'markdown-it';
import mditHighlightjs from 'markdown-it-highlightjs';
import mditEmoji from 'markdown-it-emoji';
import mditAnchor from 'markdown-it-anchor';
import mditContainer from 'markdown-it-container';
import mditDeflist from 'markdown-it-deflist';
import mditFootnote from 'markdown-it-footnote';
import mditIns from 'markdown-it-ins';
import mditMark from 'markdown-it-mark';
import mditSub from 'markdown-it-sub';
import mditSup from 'markdown-it-sup';
import mditAbbr from 'markdown-it-abbr';
import mditInclude from 'markdown-it-include';

// from vuepress-plugin-container
function call(target: any, ...args: any[]) {
  if (typeof target === 'function') {
    return target(...args);
  }
  return target;
}

type RenderOpts = {
  type: string,
  before: string|((info: string) => string),
  after: string|((info: string) => string),
};

const createRender = (opts: RenderOpts) => (tokens: any, index: number) => {
  const { type, before, after } = opts;
  const info = tokens[index].info.trim().slice(type.length).trim();
  return tokens[index].nesting === 1 ? call(before, info) : call(after, info);
};

const md = (root: string) => mdit({
  html: true,
  linkify: true,
}).use(mditHighlightjs)
  .use(mditEmoji)
  .use(mditAnchor)
  .use(mditDeflist)
  .use(mditFootnote)
  .use(mditIns)
  .use(mditMark)
  .use(mditSub)
  .use(mditSup)
  .use(mditAbbr)
  .use(mditContainer, 'theorem', {
    render: createRender({
      type: 'theorem',
      before: (info: string) => `<div class="theorem"><p class="title">${info}</p>`,
      after: '</div>',
    }),
  })
  .use(mditInclude, {
    root,
  });

export default (markdown: string, root: string):string => {
  return md(root).render(markdown);
};
