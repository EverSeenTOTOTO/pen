import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import * as logger from './logger';

export type ThemeProviderOptions = {
  logger?: typeof logger
};

export type Theme = { darkMode?: boolean };

export default class ThemeProvider {
  readonly logger?: typeof logger;

  constructor(opts: ThemeProviderOptions) {
    this.logger = opts.logger;
  }

  getTheme(theme: Theme) {
    const themStyleFiles = this.getThemeFiles(theme);
    const themeStyleScript = themStyleFiles.reduce((prev, curr) => {
      try {
        const content = fs.readFileSync(curr).toString();

        return `${prev}\n${content}`;
      } catch (e) {
        this.logger?.error(e.stack || e.message);
        return prev;
      }
    }, '');

    return themeStyleScript;
  }

  getThemeFiles(theme: Theme) {
    const themeStyleFiles = [];

    if (theme.darkMode) {
      this.logger?.info(`Pen changed to ${chalk.bold(chalk.blue('dark'))} mode.`);

      themeStyleFiles.push(path.resolve(__dirname, '../../src/spa/style/theme.dark.css'));
      themeStyleFiles.push(path.resolve(__dirname, '../../node_modules/github-markdown-css/github-markdown-dark.css'));
    } else {
      this.logger?.info(`Pen changed to ${chalk.bold(chalk.yellowBright('light'))} mode.`);

      themeStyleFiles.push(path.resolve(__dirname, '../../src/spa/style/theme.light.css'));
      themeStyleFiles.push(path.resolve(__dirname, '../../node_modules/github-markdown-css/github-markdown-light.css'));
    }

    themeStyleFiles.push(path.resolve(__dirname, `../../node_modules/highlight.js/styles/${theme.darkMode ? 'github-dark' : 'github'}.css`));

    return themeStyleFiles;
  }
}
