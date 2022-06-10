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

  expect(content).toMatch(/<h.*?UUID[^<]*A<\/h1>/);
  expect(toc![0].text).toMatch(/A/);
});

it('test process error', async () => {
  const remark = createRemark();

  const { message } = await remark.processError(new Error('TEST'));

  expect(message).toMatch(/<code.*TEST/);
});

it('test disable plugin', async () => {
  const remark = createRemark({
    plugins: [['rehype-toc-id', false]],
  });

  const { content } = await remark.process('# A');

  expect(content).not.toMatch(/<h.*?UUID[^<]*A<\/h1>/);
  expect(content).toMatch(/<h[^<]*A<\/h1>/);
});

it('test highlightjs', async () => {
  const remark = createRemark();

  const { content } = await remark.process('```ts\nconsole.log()\n```\n```bash\nls -lf\n```');

  expect(content).toMatch(/<code class="language-ts">/);
  expect(content).toMatch(/<code class="language-bash">/);
  expect(content).toMatch(/<span class="hljs-variable language_">console<\/span>/);
});

it('test container', async () => {
  const remark = createRemark();

  const { content } = await remark.process(':::warn\nTEST\n:::');

  expect(content).toMatch(/<div class="container container-warn"><p>TEST<\/p><\/div>/);
});

it('test copy', async () => {
  const remark = createRemark();

  const { content } = await remark.process('```ts\nconsole.log()\n```');

  expect(content).toMatch(/data-clipboard-text="console.log()/);
});
