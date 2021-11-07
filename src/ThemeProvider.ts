import path from 'path';
import fs from 'fs';
import * as logger from './logger';

export type Theme = {
  darkMode: boolean;
  codeStyle: string
};

export type ThemeProviderOptions = {
  logger?: typeof logger
} & Partial<Theme>;

export default class ThemeProvider {
  readonly logger?: typeof logger;

  readonly theme: Theme;

  constructor(opts: ThemeProviderOptions) {
    this.logger = opts.logger;
    this.theme = {
      darkMode: false,
      codeStyle: 'github',
      ...opts,
    };
  }

  getTheme(theme: Theme) {
    const themStyleFiles = ThemeProvider.getThemeFiles(theme);
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

  static getThemeFiles(theme: Theme) {
    const themeStyleFiles = [];

    if (theme.darkMode) {
      themeStyleFiles.push(path.resolve(__dirname, '../../src/spa/style/theme.dark.css'));
      themeStyleFiles.push(path.resolve(__dirname, '../../node_modules/github-markdown-css/github-markdown-dark.css'));
    }
    if (!theme.darkMode) {
      themeStyleFiles.push(path.resolve(__dirname, '../../src/spa/style/theme.light.css'));
      themeStyleFiles.push(path.resolve(__dirname, '../../node_modules/github-markdown-css/github-markdown-light.css'));
    }
    if (theme.codeStyle) {
      themeStyleFiles.push(path.resolve(__dirname, `../../node_modules/highlight.js/styles/${theme.codeStyle}.css`));
    }

    return themeStyleFiles;
  }
}
