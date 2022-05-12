// forked from @vue/cli-shared-utils
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import chalk from 'chalk';
import readline from 'readline';

const format = (label, msg) => msg.split('\n').map((line, i) => (i === 0
  ? `${label} ${line}`
  : line.padStart(label.length + line.length + 1))).join('\n');

const chalkTag = (msg) => chalk.bgBlackBright.white.dim(` ${msg} `);

const log = (msg = '', tag = null) => {
  if (tag) {
    console.log(format(chalkTag(tag), msg));
  } else {
    console.log(msg);
  }
};

const info = (msg, tag = null) => {
  console.log(format(chalk.bgBlueBright.black(' INFO ') + (tag ? chalkTag(tag) : ''), msg));
};

const done = (msg, tag = null) => {
  console.log(format(chalk.bgGreen.black(' DONE ') + (tag ? chalkTag(tag) : ''), msg));
};

const warn = (msg, tag = null) => {
  console.warn(format(chalk.bgYellow.black(' WARN ') + (tag ? chalkTag(tag) : ''), chalk.yellow(msg)));
};

const error = (msg, tag = null) => {
  console.error(format(chalk.bgRed(' ERROR ') + (tag ? chalkTag(tag) : ''), chalk.red(msg)));
  if (msg instanceof Error) {
    console.error(msg.stack);
  }
};

const clearConsole = (title) => {
  if (process.stdout.isTTY) {
    const blank = '\n'.repeat(process.stdout.rows);
    console.log(blank);
    readline.cursorTo(process.stdout, 0, 0);
    readline.clearScreenDown(process.stdout);
    if (title) {
      console.log(title);
    }
  }
};

export const logger = {
  log,
  info,
  warn,
  done,
  error,
  clearConsole,
};
export type Logger = typeof logger;
