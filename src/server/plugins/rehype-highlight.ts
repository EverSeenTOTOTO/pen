/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-explicit-any */
import path from 'path';
import hljs from 'highlight.js';
import parse5 from 'parse5';
import * as h2s from 'hast-util-to-string';
import * as hfp from 'hast-util-from-parse5';
import { makeCodeBlockPlugin } from './code-block';

const loadedLanguages = new Set<string>();

const loadLanguage = (lang: string) => {
  if (loadedLanguages.has(lang)) return;

  const highlightjs = path.join(__dirname, '../node_modules/highlight.js/lib/languages');

  try {
    // eslint-disable-next-line import/no-dynamic-require, @typescript-eslint/no-var-requires, global-require
    const language = require(path.join(highlightjs, `${lang}.js`));

    hljs.registerLanguage(lang, language);
    loadedLanguages.add(lang);
  } catch (e) {
    // pass
  }
};

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
