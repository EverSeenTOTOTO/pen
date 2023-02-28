import { RemarkRehype } from '@/server/rehype';
import { logger } from '@/server/logger';
import { RemarkOptions } from '@/types';

const createRemark = (opts?: Partial<RemarkOptions>) => new RemarkRehype({
  logger,
  plugins: [],
  ...opts,
});

it('test process markdown', async () => {
  const remark = createRemark();

  const { content, toc } = await remark.process('# A');

  expect(decodeURIComponent(content)).toMatch(/<h1><span id="H[^>]*><\/span><span>A<\/span><\/h1>/);
  expect(toc?.[0].text).toMatch(/A/);
});

it('test process error', async () => {
  const remark = createRemark();

  const { message } = await remark.processError(new Error('TEST'));

  expect(decodeURIComponent(message)).toMatch(/<div class="container container-error"><p>TEST<\/p>/);
});

it('test disable plugin', async () => {
  const remark = createRemark({
    plugins: [['rehype-toc-id', false]],
  });

  const data = await remark.process('# A');
  const content = decodeURIComponent(data.content);

  expect(content).not.toMatch(/<h1><span id="H[^>]*><\/span><span>A<\/span><\/h1>/);
  expect(content).toMatch(/<h1>A<\/h1>/);
});

it('test highlightjs', async () => {
  const remark = createRemark();

  const data = await remark.process('```ts\nconsole.log()\n```\n```bash\nls -lf\n```');
  const content = decodeURIComponent(data.content);

  expect(content).toMatch(/<code class="language-ts">/);
  expect(content).toMatch(/<code class="language-bash">/);
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
