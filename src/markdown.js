const mdit = require('markdown-it');

const md = mdit({ html: true, linkify: true })
  .use(require('markdown-it-highlightjs'))
  .use(require('markdown-it-emoji'))
  .use(require('markdown-it-checkbox'))
  .use(require('markdown-it-anchor'))
  .use(require('markdown-it-multimd-table'));

module.exports = (markdown) => Promise.resolve(md.render(markdown));
