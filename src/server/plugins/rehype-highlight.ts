/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-explicit-any */
import path from 'path';
import hljs from 'highlight.js/lib/core';
import parse5 from 'parse5';
import * as h2s from 'hast-util-to-string';
import * as hfp from 'hast-util-from-parse5';
import { makeCodeBlockPlugin } from './code-block';

const loadLanguage = (lang: string) => {
  const highlightjs = path.join(__dirname, '../node_modules/highlight.js/lib/languages');

  try {
    // eslint-disable-next-line import/no-dynamic-require, @typescript-eslint/no-var-requires, global-require
    const language = require(path.join(highlightjs, `${lang}.js`));

    hljs.registerLanguage(lang, language);
  } catch (e) {
    // pass
  }
};

loadLanguage('xml');
loadLanguage('bash');
loadLanguage('c');
loadLanguage('cpp');
loadLanguage('css');
loadLanguage('markdown');
loadLanguage('diff');
loadLanguage('go');
loadLanguage('java');
loadLanguage('javascript');
loadLanguage('json');
loadLanguage('lua');
loadLanguage('makefile');
loadLanguage('plaintext');
loadLanguage('python');
loadLanguage('rust');
loadLanguage('scss');
loadLanguage('yaml');
loadLanguage('typescript');

export default makeCodeBlockPlugin((language: string, node: any) => {
  try {
    loadLanguage(language);

    const code = hljs.highlight(h2s.toString(node), { language }).value;
    const hlcode = hfp.fromParse5(parse5.parse(code));

    if (hlcode.type === 'element' || hlcode.type === 'root') {
      node.children = hlcode.children;
    }
  } catch (e) {
    // pass
  }
});
