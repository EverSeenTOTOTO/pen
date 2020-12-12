import render from '../markdown';

describe('test markdown-it', () => {
  it('render title', () => {
    const title = render('# hello');
    expect(title).toMatch(/<h1.+>hello<\/h1>/);
  });

  it('render scripts', () => {
    const css = render(`
      \`\`\`css
      .app {
        color: white
      }
      \`\`\`
      `);
    expect(css).toMatch(/<pre><code class="hljs">/);
    const ts = render('`const i:string = \'2\'`');
    expect(ts).toMatch(/<p><code>const i:string = '2'<\/code><\/p>/);
  });
});
