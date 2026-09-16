// The single authority for what pen can preview as source code: a filename
// resolves to a preview tier — a grammar name (highlighted), null (known
// plain text, previewable without colors) or undefined (not previewable).
// Markdown and directories never reach this table: they are their own kinds.

// matched against the whole lowercased filename first — extensionless build
// files and dotfiles (whose "extension" would be meaningless) live here
const FILENAMES: Record<string, string | null> = {
  dockerfile: 'dockerfile',
  makefile: 'makefile',
  'cmakelists.txt': 'cmake',
  pkgbuild: 'bash',
  license: null,
  '.zshrc': 'bash',
  '.bashrc': 'bash',
  '.profile': 'bash',
  '.vimrc': 'vim',
  '.clang-format': 'yaml',
  '.clang-tidy': 'yaml',
  '.gitmodules': 'ini',
  '.npmrc': 'ini',
  '.coveragerc': 'ini',
  '.srcinfo': 'ini',
  '.pkginfo': 'ini',
  '.env': 'ini',
  '.editorconfig': 'ini',
  '.prettierrc': 'json',
  '.gitignore': null,
  '.dockerignore': null,
};

const EXTENSIONS: Record<string, string | null> = {
  // web & markup
  html: 'xml', htm: 'xml', xml: 'xml', svg: 'xml', plist: 'xml', vue: 'xml',
  css: 'css', scss: 'scss',
  js: 'javascript', mjs: 'javascript', cjs: 'javascript', jsx: 'javascript',
  ts: 'typescript', mts: 'typescript', cts: 'typescript', tsx: 'typescript',
  json: 'json', ipynb: 'json',
  // scripts
  py: 'python', sh: 'bash', bash: 'bash', zsh: 'bash', lua: 'lua',
  vim: 'vim', scm: 'scheme', ss: 'scheme', rkt: 'scheme',
  // systems
  c: 'c', h: 'c', inc: 'c',
  cpp: 'cpp', cc: 'cpp', 'c++': 'cpp', hpp: 'cpp', hh: 'cpp', cu: 'cpp', hip: 'cpp', cppm: 'cpp',
  rs: 'rust', go: 'go', java: 'java', m: 'objectivec', mm: 'objectivec',
  s: 'x86asm', asm: 'x86asm', hlsl: 'glsl', ll: 'llvm',
  // config
  yml: 'yaml', yaml: 'yaml', cmake: 'cmake',
  diff: 'diff', patch: 'diff', wat: 'wasm', wast: 'wasm',
  // known plain text without a grammar — previewable, unhighlighted
  toml: null, rst: null, mlir: null, mir: null, td: null, fir: null,
  csv: null, po: null, in: null, def: null, gn: null, modulemap: null,
};

export type PreviewTier = { language: string | null };

export function resolvePreview(filename: string): PreviewTier | undefined {
  const name = filename.toLowerCase();

  if (name in FILENAMES) return { language: FILENAMES[name] };

  // dot > 0: a leading dot is a dotfile, not an extension separator
  const dot = name.lastIndexOf('.');

  if (dot > 0) {
    const ext = name.slice(dot + 1);

    if (ext in EXTENSIONS) return { language: EXTENSIONS[ext] };
  }

  return undefined;
}
