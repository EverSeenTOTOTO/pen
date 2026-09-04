import os from 'os';
import {
  formatRelative, resolvePathInfo, stripNamespace,
} from '@/utils';

it('test formatRelative', () => {
  expect(formatRelative('')).toBe('/');
  expect(formatRelative('a/')).toBe('/a/');
  expect(formatRelative('/a')).toBe('/a');
  expect(formatRelative('a.md')).toBe('/a.md');
  expect(formatRelative('/a/')).toBe('/a/');
  expect(formatRelative('a/b')).toBe('/a/b');
  expect(formatRelative('a/b/')).toBe('/a/b/');
  expect(formatRelative('a/b.md')).toBe('/a/b.md');
  expect(formatRelative('\\a/')).toBe('/a/');
  expect(formatRelative('/a\\')).toBe('/a/');
  expect(formatRelative('/a\\b')).toBe('/a/b');
  expect(formatRelative('\\\\a\\\\')).toBe('/a/');
  expect(formatRelative('\\\\a')).toBe('/a');
  expect(formatRelative('a\\\\')).toBe('/a/');
  expect(formatRelative('a\\\\b')).toBe('/a/b');
  expect(formatRelative('a/b\\\\')).toBe('/a/b/');
  expect(formatRelative('\\\\a/b\\c/d')).toBe('/a/b/c/d');
});

it('test stripNamespace', () => {
  expect(stripNamespace('/', '/a')).toBe('/a');
  expect(stripNamespace('/a', '/a/')).toBe('/');
  expect(stripNamespace('/a', '/a/b')).toBe('/b');
});

it('test resolvePathInfo', () => {
  expect(resolvePathInfo('/', '').fullpath).toBe('/');
  expect(resolvePathInfo('/', '').relativePath).toBe('/');

  expect(resolvePathInfo('/', '/a').fullpath).toBe('/a');
  expect(resolvePathInfo('/', '/a').relativePath).toBe('/a');

  expect(resolvePathInfo('/a', '/a').fullpath).toBe('/a/a');
  expect(resolvePathInfo('/a', '/a').relativePath).toBe('/a');

  if (os.platform() === 'win32') {
    expect(resolvePathInfo('D:/a', '/a').fullpath).toBe('D:/a/a');
    expect(resolvePathInfo('D:/a', '/a').relativePath).toBe('/a');

    expect(resolvePathInfo('D:\\a', '/a').fullpath).toBe('D:/a/a');
    expect(resolvePathInfo('D:\\a', '/a').relativePath).toBe('/a');
  }
});
