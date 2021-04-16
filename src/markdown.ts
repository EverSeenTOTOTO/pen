import mdit from 'markdown-it';
import mditHighlightjs from 'markdown-it-highlightjs';
import mditAnchor from 'markdown-it-anchor';
import mditContainer from 'markdown-it-container';
import mditDeflist from 'markdown-it-deflist';
import mditIns from 'markdown-it-ins';
import mditMark from 'markdown-it-mark';
import mditSub from 'markdown-it-sub';
import mditSup from 'markdown-it-sup';
import mditAbbr from 'markdown-it-abbr';
import mditInclude from 'markdown-it-include';
import mditToc from 'markdown-it-toc-done-right';
import mditFootnote from 'markdown-it-footnote';

const createRender = (color: string) => (tokens: any, index: number) => {
  const info = tokens[index].info.trim().slice(color.length).trim();
  return tokens[index].nesting === 1
    ? `<div class="container bg-${color}"><p class="bold">${info}</p>`
    : '</div>';
};

const md = (root: string) => mdit({
  html: true,
  linkify: true,
}).use(mditHighlightjs)
  .use(mditFootnote)
  .use(mditAnchor)
  .use(mditDeflist)
  .use(mditIns)
  .use(mditMark)
  .use(mditSub)
  .use(mditSup)
  .use(mditAbbr)
  .use(mditToc)
  .use(mditContainer, 'azure', {
    render: createRender('azure'),
  })
  .use(mditContainer, 'snow', {
    render: createRender('snow'),
  })
  .use(mditContainer, 'lightyellow', {
    render: createRender('lightyellow'),
  })
  .use(mditContainer, 'honeydew', {
    render: createRender('honeydew'),
  })
  .use(mditContainer, 'mintcream', {
    render: createRender('mintcream'),
  })
  .use(mditContainer, 'aliceblue', {
    render: createRender('aliceblue'),
  })
  .use(mditContainer, 'ghostwhite', {
    render: createRender('ghostwhite'),
  })
  .use(mditContainer, 'lavenderblush', {
    render: createRender('lavenderblush'),
  })
  .use(mditInclude, {
    root,
  });

export default (markdown: string, root: string):string => {
  const mdrender = md(root);

  return mdrender.render(markdown);
};
