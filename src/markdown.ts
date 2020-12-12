import mdit from 'markdown-it';
import mditHighlightjs from 'markdown-it-highlightjs';
import mditEmoji from 'markdown-it-emoji';
import mditAnchor from 'markdown-it-anchor';

const md = mdit({
  html: true,
  linkify: true,
}).use(mditHighlightjs)
  .use(mditEmoji)
  .use(mditAnchor);

export default (markdown: string):string => md.render(markdown);
