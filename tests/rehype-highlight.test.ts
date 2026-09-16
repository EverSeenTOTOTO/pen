import { describe, it, expect } from 'vitest';
import { h } from 'hastscript';
import type { Element } from 'hast';
import rehypeHighlight, { highlightCodeBlock, highlightSource } from '@/server/plugins/rehype-highlight';
import { makeCodeBlockPlugin } from '@/server/plugins/code-block';

// exercise the exported callback through the same wrapper the default
// export is built from: makeCodeBlockPlugin(highlightCodeBlock)
const plugin = makeCodeBlockPlugin(highlightCodeBlock);

const highlight = (language: string, source: string): Element => {
  const code = h('code', { className: [`language-${language}`] }, source);
  plugin()(h('div', [h('pre', [code])]));
  return code;
};

describe('rehype-highlight', () => {
  it('highlights javascript code blocks into hljs spans', () => {
    const code = highlight('js', 'const a = 1;');
    expect(JSON.stringify(code)).toContain('hljs-keyword');
  });

  it('marks mermaid blocks without highlighting', () => {
    const code = highlight('mermaid', 'graph TD; A-->B;');
    expect(code.properties.className).toContain('pen-mermaid-source');
    expect(JSON.stringify(code)).not.toContain('hljs');
  });

  it('leaves unregistered languages untouched', () => {
    const code = highlight('brainfuck', '+++');
    expect(JSON.stringify(code)).not.toContain('hljs');
  });

  it('default export is the plugin wrapping highlightCodeBlock', () => {
    const code = h('code', { className: ['language-js'] }, 'const a = 1;');
    rehypeHighlight()(h('div', [h('pre', [code])]));
    expect(JSON.stringify(code)).toContain('hljs-keyword');
  });
});

describe('highlightSource', () => {
  it('wraps highlighted source in a pre>code html fragment', () => {
    const html = highlightSource('js', 'const a = 1;');
    expect(html).toMatch(/^<pre><code class="hljs">/);
    expect(html).toContain('hljs-keyword');
    expect(html).toContain('const');
  });

  it('escapes markup in source text', () => {
    const html = highlightSource(null, '<script>alert(1)</script>');
    expect(html).not.toContain('<script');
    expect(html).toContain('&#x3C;script');
  });

  it('renders the plain-text tier without highlight spans', () => {
    expect(highlightSource(null, 'a = 1')).toBe('<pre><code class="hljs">a = 1</code></pre>');
  });

  it('highlights the newly registered grammars', () => {
    expect(highlightSource('llvm', 'define void @f() {}')).toContain('hljs-');
    expect(highlightSource('scheme', '(define (f x) x)')).toContain('hljs-');
    expect(highlightSource('vim', 'set number')).toContain('hljs-');
    expect(highlightSource('ini', 'key = value')).toContain('hljs-');
  });
});
