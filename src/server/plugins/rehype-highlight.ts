/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-explicit-any */
import hljs from 'highlight.js/lib/core';
import parse5 from 'parse5';
import * as h2s from 'hast-util-to-string';
import * as hfp from 'hast-util-from-parse5';
import xml from 'highlight.js/lib/languages/xml';
import bash from 'highlight.js/lib/languages/bash';
import c from 'highlight.js/lib/languages/c';
import cpp from 'highlight.js/lib/languages/cpp';
import css from 'highlight.js/lib/languages/css';
import markdown from 'highlight.js/lib/languages/markdown';
import diff from 'highlight.js/lib/languages/diff';
import go from 'highlight.js/lib/languages/go';
import java from 'highlight.js/lib/languages/java';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import lua from 'highlight.js/lib/languages/lua';
import makefile from 'highlight.js/lib/languages/makefile';
import plaintext from 'highlight.js/lib/languages/plaintext';
import python from 'highlight.js/lib/languages/python';
import rust from 'highlight.js/lib/languages/rust';
import scss from 'highlight.js/lib/languages/scss';
import yaml from 'highlight.js/lib/languages/yaml';
import typescript from 'highlight.js/lib/languages/typescript';
import wasm from 'highlight.js/lib/languages/wasm';
import { makeCodeBlockPlugin } from './code-block';

hljs.registerLanguage('xml', xml);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('c', c);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('css', css);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('diff', diff);
hljs.registerLanguage('go', go);
hljs.registerLanguage('java', java);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('json', json);
hljs.registerLanguage('lua', lua);
hljs.registerLanguage('makefile', makefile);
hljs.registerLanguage('plaintext', plaintext);
hljs.registerLanguage('python', python);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('scss', scss);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('wasm', wasm);

export default makeCodeBlockPlugin((language: string, node: any) => {
  try {
    const code = hljs.highlight(h2s.toString(node), { language }).value;
    const hlcode = hfp.fromParse5(parse5.parse(code));

    if (hlcode.type === 'element' || hlcode.type === 'root') {
      node.children = hlcode.children;
    }
  } catch (e) {
    // pass
  }
});
