import { unified, Plugin, Processor } from 'unified';
import remarkParse from 'remark-parse';
import remarkGFM from 'remark-gfm';
import remarkToc from 'remark-toc';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import rehypeHighlight from 'rehype-highlight';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeStringify from 'rehype-stringify';
import { RemarkOptions, RemarkPlugin } from '../types';
import { Logger } from './logger';
import { loadLanguages } from './lang';

const defaultPlugins = [
  ['remark-parse', remarkParse],
  ['remark-gfm', remarkGFM],
  ['remark-toc', remarkToc, {
    heading: 'toc|table[ -]of[ -]contents?|目录',
  }],
  ['remark-rehype', remarkRehype, { allowDangerousHtml: true }],
  /* -------- Seperator for remark and rehype -------- */
  ['rehype-raw', rehypeRaw],
  ['rehype-slug', rehypeSlug],
  ['rehype-autolink-headings', rehypeAutolinkHeadings],
  ['rehype-highlight', rehypeHighlight, {
    ignoreMissing: true,
    plainText: ['txt', 'text'],
    languages: loadLanguages(),
  }],
  ['rehype-stringify', rehypeStringify],
];

const formatError = (e: Error) => `
\`\`\`txt
${e.message}

${e.stack}
\`\`\`
`;

export class RemarkRehype {
  render: Processor;

  logger: Logger;

  constructor(options: RemarkOptions) {
    this.render = unified();
    this.logger = options.logger;

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

  async process(markdown: string): Promise<string> {
    try {
      const f = await this.render
        .process(markdown);
      return f.toString();
    } catch (reason) {
      return String(reason);
    }
  }

  async processError(e?: Error) {
    const error = e?.message
      ? e
      : new Error('An unexpect error has occured when processing markdown', { cause: e instanceof Error ? e : undefined });

    try {
      const f = await this.process(formatError(error));
      return f.toString();
    } catch (err) {
      return error.message;
    }
  }
}
