import betterLogger from 'better-logging';
import { PASS } from '../utils';

export type Logger = Pick<Console, 'log' | 'info' | 'warn' | 'error' | 'clear'> & {
  done: Console['log'],
};

export const emptyLogger: Logger = {
  log: PASS,
  info: PASS,
  warn: PASS,
  error: PASS,
  done: PASS,
  clear: PASS,
};

betterLogger(console);

export const extendLogger = (basic: Logger, prefix = 'App'): Logger => {
  const addPrefix = (method: keyof Logger) => (...args: any[]) => basic[method](`[${prefix}]`, ...args);

  return {
    log: addPrefix('log'),
    info: addPrefix('info'),
    warn: addPrefix('warn'),
    error: addPrefix('error'),
    done: addPrefix('done'),
    clear: () => basic.clear(),
  };
};

export const logger = { ...console, done: console.info.bind(console) };
