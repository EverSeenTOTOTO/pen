import type { DocToc, RemarkOptions, RemarkPlugin } from '@/types';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import remarkDirective from 'remark-directive';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGFM from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import type { Plugin, Processor } from 'unified';
import { perf } from '../utils';
import { paint } from './logger';
import { rehypeSlugToc, PEN_TOC_DATA } from './plugins/rehype-toc';
import rehypeHighlight from './plugins/rehype-highlight';
import rehypeCopy from './plugins/rehype-copy';
import { makeContainerPlugin } from './plugins/remark-container';
import type { Logger } from './logger';

/**
 * Sanitize runs right after rehype-raw, while the tree still only holds
 * user-supplied markup (markdown-generated nodes plus raw html): everything
 * downstream — heading ids, copy buttons, katex/mermaid output — is our own
 * generation and never passes through it. Schema is the default plus the
 * html features pen documents commonly use.
 */
const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames ?? []),
    'details',
    'summary',
    'kbd',
    'mark',
    'picture',
    'source',
  ],
  attributes: {
    ...defaultSchema.attributes,
    '*': [...(defaultSchema.attributes?.['*'] ?? []), 'className'],
    source: ['src', 'srcset', 'type', 'media'],
  },
};

const defaultPlugins = [
  ['remark-parse', remarkParse],
  ['remark-frontmatter', remarkFrontmatter],
  ['remark-directive', remarkDirective],
  ['remark-gfm', remarkGFM],
  ['remark-container', makeContainerPlugin(['info', 'warn', 'error'])],
  ['remark-math', remarkMath],
  ['remark-rehype', remarkRehype, { allowDangerousHtml: true }],
  /* -------- Seperator for remark and rehype -------- */
  ['rehype-raw', rehypeRaw],
  ['rehype-sanitize', rehypeSanitize, sanitizeSchema],
  ['rehype-slug-toc', rehypeSlugToc],
  ['rehype-copy', rehypeCopy],
  ['rehype-highlight', rehypeHighlight],
  ['rehype-katex', rehypeKatex, { strict: false }], // FIXME: too slow on server side
  ['rehype-stringify', rehypeStringify],
];

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
        this.logger.debug(`plugin   ${name}`);

        // unified's use() overloads cannot express "any plugin with any settings";
        // bridge via a Plugin with unknown parameters.
        this.render.use(plug as Plugin<unknown[], any, any>, ...opts);
      }
    }

    const enabled = [...plugins.values()].filter(([ , plug]) => plug !== false).length;
    this.logger.info(`pipeline ready (${paint.metric(String(enabled))} plugins)`);
  }

  async process(markdown: string): Promise<{ content: string, toc?: DocToc[] }> {
    try {
      perf?.mark('process content');

      const file = await this.render.process(markdown);
      const content = file.toString();
      const toc = file.data[PEN_TOC_DATA] as DocToc[] | undefined;

      perf?.measure('process content done', 'process content');

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
