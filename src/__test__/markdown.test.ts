import render from '../markdown';

describe('test markdown-it', () => {
  it('test render title', () => {
    const title = render('# hello', __dirname);
    expect(title).toMatch(/<h1.+>hello<\/h1>/);
  });

  it('test render css', () => {
    const css = render(`
      \`\`\`css
      .app {
        color: white
      }
      \`\`\`
      `, __dirname);
    expect(css).toMatch(/<pre><code class="hljs">/);
  });

  it('test render container', () => {
    const html = render(`
::: snow demo
wow
:::`, __dirname);
    expect(html).toMatch(/<div class="container bg-snow">/);
  });

  it('test render file inclusion', () => {
    const html = render('!!!include(header.md)!!!\n\n*your content*\n\n', __dirname);
    expect(html).toMatch(/my header/);
  });

  it('test render toc', () => {
    const html = render('[[toc]]', __dirname);
    expect(html).toMatch(/table-of-contents/);
  });
});
