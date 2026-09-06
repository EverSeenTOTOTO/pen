import betterLogger from 'better-logging';
import chalk from 'chalk';
import { PASS } from '../utils';

export type Logger = Pick<Console, 'log' | 'info' | 'warn' | 'error' | 'clear'> & {
  done: Console['log'],
  debug: Console['log'],
};

export const emptyLogger: Logger = {
  log: PASS,
  info: PASS,
  warn: PASS,
  error: PASS,
  done: PASS,
  debug: PASS,
  clear: PASS,
};

betterLogger(console, {
  formatStamp: (content) => String(content), // no brackets around time/level
  format: (ctx) => `${ctx.time} ${ctx.type}  ${ctx.msg}`,
  color: {
    base: chalk.gray,
    type: {
      log: chalk.white,
      debug: chalk.blueBright,
      info: chalk.cyanBright,
      warn: chalk.yellowBright,
      error: chalk.redBright,
    },
  },
});

/** aligned dim scope label for log lines: `request GET / 200 9ms` */
export const scope = (name: string) => chalk.gray(name.padEnd(8));

/** semantic paints shared across log call sites */
export const paint = {
  ok: chalk.green,
  changed: chalk.yellow,
  gone: chalk.red,
  accent: chalk.hex('#d6a35c'), // the visual language's amber
  metric: chalk.cyan,
  slow: (ms: number) => (ms >= 500 ? chalk.red : ms >= 100 ? chalk.yellow : chalk.gray),
  status: (code: number) => (code >= 500 ? chalk.red : code >= 400 ? chalk.yellow : code >= 300 ? chalk.cyan : chalk.green),
};

/** framed startup summary — printed as one log entry: only the first row
 * carries the `time level` prefix, so continuation rows are padded to that
 * width (12 time + 1 space + 4 info + 2 gap — must match the format config
 * above). Values may carry ansi colors; widths are measured on visible text. */
export const printBanner = (logger: Logger, title: string, rows: Array<[string, string]>) => {
  // eslint-disable-next-line no-control-regex -- stripping ansi escapes is the point
  const ANSI = /\u001b\[[0-9;]*m/g;
  const visible = (s: string) => s.replace(ANSI, '');
  const visibleLength = (s: string) => visible(s).length;
  const KEY_WIDTH = 9; // rows render as `key.padEnd(9) + ' ' + value`
  const INDENT = ' '.repeat(19); // align under the first row's prefix
  const contentWidth = Math.max(visibleLength(title), ...rows.map(([, value]) => KEY_WIDTH + 1 + visibleLength(value)));
  const row = (text: string, pad: number) => ` ${text}${' '.repeat(Math.max(0, pad))} `;
  // title embedded in the top rule so top and bottom borders are the same
  // `─` run — a bare title row reads as a missing border
  const titleText = ` ${title} `;
  const dashesLeft = 3;
  const dashesRight = Math.max(0, contentWidth + 2 - dashesLeft - visibleLength(titleText));
  const lines = [
    chalk.gray('┌') + chalk.gray('─'.repeat(dashesLeft)) + paint.accent.bold(titleText) + chalk.gray('─'.repeat(dashesRight)) + chalk.gray('┐'),
    ...rows.map(([key, value]) => (
      chalk.gray('│') + row(`${chalk.gray(key.padEnd(KEY_WIDTH))} ${value}`, contentWidth - KEY_WIDTH - 1 - visibleLength(value)) + chalk.gray('│')
    )),
    chalk.gray('└') + '─'.repeat(contentWidth + 2) + chalk.gray('┘'),
  ];

  logger.done(lines.join(`\n${INDENT}`));
};

export const extendLogger = (basic: Logger, prefix = 'App'): Logger => {
  const addPrefix = (method: keyof Logger) => (...args: any[]) => basic[method](`[${prefix}]`, ...args);

  return {
    log: addPrefix('log'),
    info: addPrefix('info'),
    warn: addPrefix('warn'),
    error: addPrefix('error'),
    done: addPrefix('done'),
    debug: addPrefix('debug'),
    clear: () => basic.clear(),
  };
};

export const logger = { ...console, done: console.info.bind(console), debug: (console as Console).debug.bind(console) };
