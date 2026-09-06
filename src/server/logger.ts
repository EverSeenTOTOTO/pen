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

/** framed startup summary — one logger call so only the first line is prefixed */
export const printBanner = (logger: Logger, title: string, rows: Array<[string, string]>) => {
  const KEY_WIDTH = 9; // rows render as `key.padEnd(9) + ' ' + value`
  const contentWidth = Math.max(title.length, ...rows.map(([, value]) => KEY_WIDTH + 1 + value.length));
  const row = (text: string, pad: number) => ` ${text}${' '.repeat(Math.max(0, pad))} `;
  const block = [
    chalk.gray('┌') + row(chalk.bold(title), contentWidth - title.length) + chalk.gray('┐'),
    ...rows.map(([key, value]) => (
      chalk.gray('│') + row(`${chalk.gray(key.padEnd(KEY_WIDTH))} ${value}`, contentWidth - KEY_WIDTH - 1 - value.length) + chalk.gray('│')
    )),
    chalk.gray('└') + '─'.repeat(contentWidth + 2) + chalk.gray('┘'),
  ].join('\n');

  logger.done(block);
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
