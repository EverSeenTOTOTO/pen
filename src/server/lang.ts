import path from 'path';

const supportLanguageList = [
  'awk',
  'bash',
  'bnf',
  'c',
  'cmake',
  'cpp',
  'csharp',
  'diff',
  'dockerfile',
  'go',
  'graphql',
  'haskell',
  'java',
  'javascript',
  'json',
  'latex',
  'llvm',
  'lua',
  'makefile',
  'markdown',
  'nginx',
  'perl',
  'profile',
  'python-repl',
  'python',
  'rust',
  'scheme',
  'scss',
  'shell',
  'sql',
  'typescript',
  'vim',
  'wasm',
  'x86asm',
  'xml',
  'yaml',
];

export const loadLanguages = () => {
  const highlightjs = path.join(__dirname, '../node_modules/highlight.js/lib/languages');
  const languages: Record<string, (...args: unknown[]) => unknown> = {};

  supportLanguageList
    .forEach((lang) => {
      try {
        // eslint-disable-next-line import/no-dynamic-require, @typescript-eslint/no-var-requires, global-require
        const language = require(path.join(highlightjs, `${lang}.js`));

        languages[lang] = language;
      } catch (e) {
        // pass
      }
    });

  return languages;
};
