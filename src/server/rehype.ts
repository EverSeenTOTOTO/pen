import { DocToc, RemarkOptions, RemarkPlugin } from '@/types';
import rehypeParse from 'rehype-parse';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import remarkDirective from 'remark-directive';
import remarkGFM from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified, Plugin, Processor } from 'unified';
import { perf } from '../utils';
import { rehypeToc, rehypeTocId } from './plugins/rehype-toc';
import rehypeHighlight from './plugins/rehype-highlight';
import rehypeCopy from './plugins/rehype-copy';
import { makeContainerPlugin } from './plugins/remark-container';
import { Logger } from './logger';

const defaultPlugins = [
  ['remark-parse', remarkParse],
  ['remark-directive', remarkDirective],
  ['remark-gfm', remarkGFM],
  ['remark-container', makeContainerPlugin(['info', 'warn', 'error'])],
  ['remark-math', remarkMath],
  ['remark-rehype', remarkRehype, { allowDangerousHtml: true }], // FIXME: stupid escape strategy
  /* -------- Seperator for remark and rehype -------- */
  ['rehype-raw', rehypeRaw],
  ['rehype-toc-id', rehypeTocId],
  ['rehype-copy', rehypeCopy],
  ['rehype-highlight', rehypeHighlight],
  ['rehype-katex', rehypeKatex, { strict: false }], // FIXME: too slow on server side
  ['rehype-stringify', rehypeStringify],
];

export class RemarkRehype {
  render: Processor;

  logger: Logger;

  tocExtractor: Processor;

  constructor(options: RemarkOptions) {
    this.render = unified();
    this.logger = options.logger;
    this.tocExtractor = unified().use(rehypeParse).use(rehypeToc);

    this.usePlugins(options.plugins);
  }

  usePlugins(userPlugins: RemarkOptions['plugins']) {
    const plugins = new Map<string, RemarkPlugin>();

    for (const p of [...defaultPlugins, ...userPlugins]) {
      plugins.set(p[0] as string, p as RemarkPlugin);
    }

    for (const [name, plug, ...opts] of [...plugins.values()]) {
      if (plug !== false) {
        this.logger.info(`Pen add remark/rehype plugin: ${name}`);

        this.render.use(plug as Plugin, ...opts);
      }
    }
  }

  async process(markdown: string): Promise<{ content: string, toc?: DocToc[] }> {
    try {
      perf?.mark('process content');

      const content = (await this.render.process(markdown)).toString();

      perf?.measure('process content done', 'process content');
      perf?.mark('process toc');

      const toc = (await this.tocExtractor.process(content)).result as DocToc[];

      perf?.measure('process toc done', 'process toc');

      return { content: encodeURIComponent(content), toc };
    } catch (reason) {
      // TODO: cannot use processError because that may cause infinite loop
      return { content: `Remark/Rehype Error: ${String(reason)}` };
    }
  }

  async processError(e?: Error) {
    const error = e?.message
      ? e
      : new Error('An unexpect error has occured when processing markdown.');

    try {
      const { content } = await this.process(RemarkRehype.formatError(error));

      return { message: content };
    } catch (err) {
      return { message: error.message };
    }
  }

  static formatError(e: Error) {
    return `
:::error
${e.message}

${e.stack}
:::
`;
  }
}
