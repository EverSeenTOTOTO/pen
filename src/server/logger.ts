export type Logger = {
  log: Console['log'],
  info: Console['info'],
  warn: Console['warn'],
  error: Console['error'],
  done: Console['log'],
  clear: Console['clear']
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

export const logger: Logger = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  done: console.log,
  clear: console.clear,
};
