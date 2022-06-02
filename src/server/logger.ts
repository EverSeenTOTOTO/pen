import betterLogger from 'better-logging';

export type Logger = Pick<Console, 'log' | 'info' | 'warn' | 'error' | 'clear'> & {
  done: Console['log'],
};

const PASS = () => {};
export const emptyLogger: Logger = {
  log: PASS,
  info: PASS,
  warn: PASS,
  error: PASS,
  done: PASS,
  clear: PASS,
};

betterLogger(console);

export const logger = { ...console, done: console.info.bind(console) };
