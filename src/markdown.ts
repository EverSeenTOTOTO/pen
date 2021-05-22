import mdit from 'markdown-it';
import mditHighlightjs from 'markdown-it-highlightjs';
import mditAnchor from 'markdown-it-anchor';
import mditDeflist from 'markdown-it-deflist';
import mditIns from 'markdown-it-ins';
import mditMark from 'markdown-it-mark';
import mditSub from 'markdown-it-sub';
import mditSup from 'markdown-it-sup';
import mditAbbr from 'markdown-it-abbr';
import mditInclude from 'markdown-it-include';
import mditToc from 'markdown-it-toc-done-right';
import mditFootnote from 'markdown-it-footnote';
import mditKatex from 'markdown-it-katex';
import mditCopy from 'markdown-it-copy';
import mditContainer from 'markdown-it-container';

const createRender = (color: string) => (tokens: any, index: number) => {
  // const info = tokens[index].info.trim().slice(color.length).trim();
  return tokens[index].nesting === 1
    ? `<div class="container container-${color}">`
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
  .use(mditKatex)
  .use(mditCopy, {
    btnText: 'copy', // 'copy' | button text
    failText: 'copy failed', // 'copy fail' | copy-fail text
    successText: 'copied', // 'copy success' | copy-success text
    successTextDelay: 2000, // 2000 | successText show time [ms]
    extraHtmlBeforeBtn: '', // '' | a html-fragment before <button>
    extraHtmlAfterBtn: '', // '' | a html-fragment after <button>
    // eslint-disable-next-line max-len
    showCodeLanguage: false, // false | show code language before [btn || extraHtmlBeforeBtn] | [add-after-1.1.0]
    attachText: '', // '' | some text append copyText， Such as: copyright | [add-after-1.2.0]
  })
  .use(mditContainer, 'Warn', {
    render: createRender('warn'),
  })
  .use(mditContainer, 'Info', {
    render: createRender('info'),
  })
  .use(mditContainer, 'Error', {
    render: createRender('error'),
  })
  .use(mditInclude, {
    root,
  });

export default (markdown: string, root: string):string => {
  const mdrender = md(root);

  return mdrender.render(markdown);
};
