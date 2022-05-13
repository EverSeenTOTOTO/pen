import { formatPath, stripNamespace } from '@/utils';

it('test formatPath', () => {
  expect(formatPath('')).toBe('/');
  expect(formatPath('a/')).toBe('/a');
  expect(formatPath('/a')).toBe('/a');
  expect(formatPath('a.m/')).toBe('/a.m');
  expect(formatPath('/a/')).toBe('/a');
  expect(formatPath('a/b')).toBe('/a/b');
  expect(formatPath('a/b/')).toBe('/a/b');
  expect(formatPath('a/b.md/')).toBe('/a/b.md');
  expect(formatPath('\\a/')).toBe('/a');
  expect(formatPath('/a\\')).toBe('/a');
  expect(formatPath('\\\\a\\\\')).toBe('/a');
  expect(formatPath('\\\\a')).toBe('/a');
  expect(formatPath('a\\\\')).toBe('/a');
  expect(formatPath('a\\\\b')).toBe('/a/b');
  expect(formatPath('a/b\\\\')).toBe('/a/b');
  expect(formatPath('\\\\a/b\\c/d')).toBe('/a/b/c/d');
});

it('test stripNamespace', () => {
  expect(stripNamespace('/', '/a')).toBe('/a');
  expect(stripNamespace('/a', '/a/')).toBe('/');
  expect(stripNamespace('/a', '/a/b')).toBe('/b');
});
