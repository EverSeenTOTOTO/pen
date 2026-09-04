export default {
  extends: ['stylelint-config-standard'],
  ignoreFiles: [
    'dist/**',
    // vendored css copied into src/assets by `make prepare` (on-disk only)
    'src/assets/github-markdown-*.css',
    'src/assets/highlightjs-github-*.css',
    'src/assets/katex*',
    'src/assets/fonts/**',
  ],
  rules: {
    'custom-property-pattern': null,
  },
};
