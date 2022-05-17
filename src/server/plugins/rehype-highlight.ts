/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-explicit-any */
import path from 'path';
import hljs from 'highlight.js';
import parse5 from 'parse5';
import * as h2s from 'hast-util-to-string';
import * as hfp from 'hast-util-from-parse5';
import { makeCodeBlockPlugin } from './code-block';

const supportLanguageList = [
  'awk',
  'bash',
  'bnf',
  'c',
  'cmake',
  'cpp',
  'csharp',
  'diff',
  'dockerfile',
  'go',
  'graphql',
  'haskell',
  'java',
  'javascript',
  'json',
  'latex',
  'llvm',
  'lua',
  'makefile',
  'markdown',
  'nginx',
  'perl',
  'profile',
  'python-repl',
  'python',
  'rust',
  'scheme',
  'scss',
  'shell',
  'sql',
  'typescript',
  'vim',
  'wasm',
  'x86asm',
  'xml',
  'yaml',
];

const createHighlighter = () => {
  const highlightjs = path.join(__dirname, '../node_modules/highlight.js/lib/languages');

  supportLanguageList
    .forEach((lang) => {
      try {
        // eslint-disable-next-line import/no-dynamic-require, @typescript-eslint/no-var-requires, global-require
        const language = require(path.join(highlightjs, `${lang}.js`));

        hljs.registerLanguage(lang, language);
      } catch (e) {
        // pass
      }
    });

  return hljs;
};

createHighlighter();

export default makeCodeBlockPlugin((language: string | undefined, node: any) => {
  if (!language) return;

  try {
    const code = hljs.highlight(h2s.toString(node), { language }).value;
    const ast = hfp.fromParse5(parse5.parse(code));

    if (ast.type === 'element' || ast.type === 'root') {
      node.children = ast.children;
    }
  } catch (e) {
    // pass
    console.log(e);
  }
});
