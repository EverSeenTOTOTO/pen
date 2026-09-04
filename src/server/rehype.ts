import type { DocToc, RemarkOptions, RemarkPlugin } from '@/types';
import rehypeParse from 'rehype-parse';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import remarkDirective from 'remark-directive';
import remarkGFM from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import type { Plugin, Processor } from 'unified';
import { perf } from '../utils';
import { rehypeToc, rehypeTocId } from './plugins/rehype-toc';
import rehypeHighlight from './plugins/rehype-highlight';
import rehypeCopy from './plugins/rehype-copy';
import { makeContainerPlugin } from './plugins/remark-container';
import type { Logger } from './logger';

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
    // rehype-parse@8 ships unified@10 types; cast to the unified@11 Plugin to
    // bridge the two type packages until Task 8 removes this code path.
    const extractor = unified();
    extractor.use(rehypeParse as unknown as Plugin);
    extractor.use(rehypeToc);
    this.tocExtractor = extractor;

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

        // unified's use() overloads cannot express "any plugin with any settings";
        // bridge via a Plugin with unknown parameters.
        this.render.use(plug as Plugin<unknown[], any, any>, ...opts);
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
    } catch {
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
