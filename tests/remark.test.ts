import { RemarkRehype } from '@/server/rehype';
import { logger } from '@/server/logger';
import type { RemarkOptions } from '@/types';

const createRemark = (opts?: Partial<RemarkOptions>) => new RemarkRehype({
  logger,
  plugins: [],
  ...opts,
});

it('test process markdown', async () => {
  const remark = createRemark();

  const { content, toc } = await remark.process('# A');

  expect(decodeURIComponent(content)).toMatch(/<h1 id="a">A<\/h1>/);
  expect(toc?.[0].text).toBe('A');
});

it('test process error', async () => {
  const remark = createRemark();

  const { message } = await remark.processError(new Error('TEST'));

  expect(decodeURIComponent(message)).toMatch(/<div class="container container-error"><p>TEST<\/p>/);
});

it('test disable plugin', async () => {
  const remark = createRemark({
    plugins: [['rehype-slug-toc', false]],
  });

  const data = await remark.process('# A');
  const content = decodeURIComponent(data.content);

  expect(content).not.toMatch(/<h1 id=/);
  expect(content).toMatch(/<h1>A<\/h1>/);
});

it('test highlightjs', async () => {
  const remark = createRemark();

  const data = await remark.process('```ts\nconsole.log()\n```\n```bash\nls -lf\n```');
  const content = decodeURIComponent(data.content);

  // the hljs base class is added for theme base colors
  expect(content).toMatch(/<code class="language-ts hljs">/);
  expect(content).toMatch(/<code class="language-bash hljs">/);
});

it('test container', async () => {
  const remark = createRemark();

  const { content } = await remark.process(':::warn\nTEST\n:::');

  expect(decodeURIComponent(content)).toMatch(/<div class="container container-warn"><p>TEST<\/p><\/div>/);
});

it('test copy', async () => {
  const remark = createRemark();

  const { content } = await remark.process('```ts\nconsole.log()\n```');

  expect(decodeURIComponent(content)).toMatch(/data-clipboard-text="console.log()/);
});

it('test sanitize raw html', async () => {
  const remark = createRemark();

  const { content } = await remark.process(
    '<script>window.__pwned = true</script>\n\n<img src="x" onerror="alert(1)" />\n\n[evil](javascript:alert(1))',
  );
  const html = decodeURIComponent(content);

  expect(html).not.toMatch(/<script/);
  expect(html).not.toMatch(/onerror/);
  expect(html).not.toMatch(/javascript:/);
});

it('test frontmatter stripped', async () => {
  const remark = createRemark();

  const { content } = await remark.process('---\ntitle: T\n---\n\n# A');
  const html = decodeURIComponent(content);

  expect(html).not.toMatch(/title: T/);
  expect(html).toMatch(/<h1 id="a">A<\/h1>/);
});

it('test toc', async () => {
  const remark = createRemark();

  let { toc } = await remark.process('## A\n ## A\n ## A');

  const tocId0 = toc?.[0].id;
  const tocId1 = toc?.[1].id;

  expect(tocId0).not.toBe(tocId1);

  toc = (await remark.process('## A\n## A')).toc;

  expect(toc?.length).toBe(2);
  expect(toc?.[0].id).toBe(tocId0);
  expect(toc?.[1].id).toBe(tocId1);
});
