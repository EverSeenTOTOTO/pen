import { describe, it, expect } from 'vitest';
import { resolvePreview } from '@/languages';
import { resolvePathInfo } from '@/utils';

describe('resolvePreview', () => {
  it('maps known filenames case-insensitively', () => {
    expect(resolvePreview('Dockerfile')).toEqual({ language: 'dockerfile' });
    expect(resolvePreview('makefile')).toEqual({ language: 'makefile' });
    expect(resolvePreview('CMakeLists.txt')).toEqual({ language: 'cmake' });
    expect(resolvePreview('LICENSE')).toEqual({ language: null });
    expect(resolvePreview('.gitignore')).toEqual({ language: null });
    expect(resolvePreview('.env')).toEqual({ language: 'ini' });
  });

  it('maps extensions case-insensitively', () => {
    expect(resolvePreview('main.ts')).toEqual({ language: 'typescript' });
    expect(resolvePreview('MAIN.TS')).toEqual({ language: 'typescript' });
    expect(resolvePreview('styles.scss')).toEqual({ language: 'scss' });
    expect(resolvePreview('plot.m')).toEqual({ language: 'objectivec' });
    expect(resolvePreview('run.rkt')).toEqual({ language: 'scheme' });
    expect(resolvePreview('hello.ll')).toEqual({ language: 'llvm' });
  });

  it('falls back to plain text when no grammar exists', () => {
    expect(resolvePreview('config.toml')).toEqual({ language: null });
    expect(resolvePreview('notes.rst')).toEqual({ language: null });
    expect(resolvePreview('Ops.mlir')).toEqual({ language: null });
  });

  it('rejects everything outside the whitelist', () => {
    expect(resolvePreview('note.txt')).toBeUndefined();
    expect(resolvePreview('pixel.png')).toBeUndefined();
    expect(resolvePreview('vector')).toBeUndefined();
    expect(resolvePreview('.eslintrc')).toBeUndefined();
    expect(resolvePreview('.env.local')).toBeUndefined();
  });
});

describe('resolvePathInfo kinds', () => {
  it('classifies whitelisted sources as code', () => {
    expect(resolvePathInfo('/', '/x/main.ts').type).toBe('code');
    expect(resolvePathInfo('/', '/x/config.toml').type).toBe('code');
    expect(resolvePathInfo('/', '/x/CMakeLists.txt').type).toBe('code');
  });

  it('keeps markdown and other apart from code', () => {
    expect(resolvePathInfo('/', '/x/README.md').type).toBe('markdown');
    expect(resolvePathInfo('/', '/x/pixel.png').type).toBe('other');
    expect(resolvePathInfo('/', '/x/note.txt').type).toBe('other');
  });
});
