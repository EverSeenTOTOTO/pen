import os from 'os';
import {
  formatRelative, resolvePathInfo, stripNamespace, uuid,
} from '@/utils';

it('test formatRelative', () => {
  expect(formatRelative('')).toBe('/');
  expect(formatRelative('a/')).toBe('/a');
  expect(formatRelative('/a')).toBe('/a');
  expect(formatRelative('a.m/')).toBe('/a.m');
  expect(formatRelative('/a/')).toBe('/a');
  expect(formatRelative('a/b')).toBe('/a/b');
  expect(formatRelative('a/b/')).toBe('/a/b');
  expect(formatRelative('a/b.md/')).toBe('/a/b.md');
  expect(formatRelative('\\a/')).toBe('/a');
  expect(formatRelative('/a\\')).toBe('/a');
  expect(formatRelative('/a\\b')).toBe('/a/b');
  expect(formatRelative('\\\\a\\\\')).toBe('/a');
  expect(formatRelative('\\\\a')).toBe('/a');
  expect(formatRelative('a\\\\')).toBe('/a');
  expect(formatRelative('a\\\\b')).toBe('/a/b');
  expect(formatRelative('a/b\\\\')).toBe('/a/b');
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

it('test uuid', () => {
  const map = new Map<string, boolean>();

  let diff = true;

  // FIXME: will got conflict number for larger numbers
  for (let i = 0; i < 1000; ++i) {
    const id = uuid();

    if (map.get(id) === true) {
      diff = false;
      console.error(`Conflict id ${id}, ${map.size}`);
      break;
    }

    map.set(id, true);
  }

  expect(diff).toBe(true);
});
