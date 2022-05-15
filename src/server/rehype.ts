import { unified, Plugin, Processor } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import { RemarkOptions } from '../types';
import { Logger } from './logger';

const defaultPlugins = [
  ['remark-parse', remarkParse] as [string, Plugin],
  ['remark-rehype', remarkRehype] as [string, Plugin],
  ['rehype-sanitize', rehypeSanitize] as [string, Plugin],
  ['rehype-stringify', rehypeStringify] as [string, Plugin],
];

const formatError = (e: Error) => `
\`\`\`txt
${e.message}

${e.stack}
\`\`\`
`;

export class RemarkRehype {
  render: Processor;

  logger?: Logger;

  constructor(options: RemarkOptions) {
    this.render = unified();
    this.logger = options.logger;

    const plugins = [...defaultPlugins, ...options.plugins];
    for (const [name, plug, ...opts] of plugins) {
      this.logger?.info(`Pen add remark/rehype plugin: ${name}`);

      this.render.use(plug, ...opts);
    }
  }

  use(plug: Plugin) {
    this.render.use(plug);
  }

  process(markdown: string): Promise<string> {
    return this.render
      .process(markdown)
      .then((f) => f.toString())
      .catch(this.processError.bind(this));
  }

  processError(e?: Error) {
    const error = e?.message ? e : new Error('An unexpect error has occured when processing markdown');

    this.logger?.error(error.message);

    return this.process(formatError(error)).then((f) => f.toString()).catch(() => error.message);
  }
}
