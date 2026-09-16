import { createLowlight } from 'lowlight';
import { toString } from 'hast-util-to-string';
import { unified } from 'unified';
import rehypeStringify from 'rehype-stringify';
import type { Element, Root } from 'hast';
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
import llvm from 'highlight.js/lib/languages/llvm';
import vim from 'highlight.js/lib/languages/vim';
import objectivec from 'highlight.js/lib/languages/objectivec';
import cmake from 'highlight.js/lib/languages/cmake';
import glsl from 'highlight.js/lib/languages/glsl';
import x86asm from 'highlight.js/lib/languages/x86asm';
import ini from 'highlight.js/lib/languages/ini';
import scheme from 'highlight.js/lib/languages/scheme';
import { makeCodeBlockPlugin } from './code-block';

const languages = {
  xml, bash, c, cpp, css, markdown, diff, go, java,
  javascript, json, lua, makefile, plaintext, python,
  rust, scss, yaml, typescript, wasm,
  llvm, vim, objectivec, cmake, glsl, x86asm, ini, scheme,
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

// serialize synthetic <pre><code> fragments once — rehype-stringify escapes
// text nodes, so arbitrary file source cannot inject markup
const stringify = unified().use(rehypeStringify);

/**
 * Render a source file body for the code preview: the same highlighter as
 * fenced blocks, applied to a synthetic code element instead of markdown
 * output. A null language is the plain-text tier — escaped, unhighlighted.
 */
export const highlightSource = (language: string | null, source: string): string => {
  const code: Element = {
    type: 'element',
    tagName: 'code',
    properties: { className: ['hljs'] },
    children: [{ type: 'text', value: source }],
  };

  if (language) highlightCodeBlock(language, code);

  const tree: Root = {
    type: 'root',
    children: [{
      type: 'element',
      tagName: 'pre',
      properties: {},
      children: [code],
    }],
  };

  return stringify.stringify(tree);
};
