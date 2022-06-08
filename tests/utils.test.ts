import { formatPath, stripNamespace, uuid } from '@/utils';

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
