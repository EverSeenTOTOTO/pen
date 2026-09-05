import { createLowlight } from 'lowlight';
import { toString } from 'hast-util-to-string';
import type { Element } from 'hast';
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

const languages = {
  xml, bash, c, cpp, css, markdown, diff, go, java,
  javascript, json, lua, makefile, plaintext, python,
  rust, scss, yaml, typescript, wasm,
};

const lowlight = createLowlight(languages);

lowlight.registerAlias({
  xml: 'html',
  javascript: ['js', 'mjs'],
  typescript: 'ts',
  bash: ['shell', 'sh'],
  python: 'py',
  cpp: 'c++',
  yaml: 'yml',
});

/**
 * Highlight a fenced code block in place, straight into hast children —
 * no parse5 html round-trip. Mermaid blocks are marked and left for the
 * client to render lazily.
 */
export const highlightCodeBlock = (language: string, code: Element): void => {
  if (language === 'mermaid') {
    code.properties.className = ['pen-mermaid-source'];
    return; // not highlighted server-side, source stays for the client render
  }

  if (!lowlight.registered(language)) return;

  try {
    code.children = lowlight.highlight(language, toString(code)).children as Element['children'];
    // the hljs theme css keys its base code colors off `.hljs`
    const classes = ((code.properties.className ?? []) as string[]).filter((c) => c !== 'hljs');
    classes.push('hljs');
    code.properties.className = classes;
  } catch {
    // pass: leave the plain text untouched on grammar errors
  }
};

export default makeCodeBlockPlugin(highlightCodeBlock);
