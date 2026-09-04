import { describe, it, expect } from 'vitest';
import { parseCookies, serializeCookie } from '@/cookie';

describe('cookie helpers', () => {
  it('parses a cookie string', () => {
    expect(parseCookies('a=1; themeMode=%22dark%22')).toEqual({ a: '1', themeMode: '"dark"' });
  });
  it('serializes with max-age', () => {
    expect(serializeCookie('k', 'v', 1)).toBe('k=v; max-age=86400; path=/; samesite=lax');
  });
  it('serializes uri-encoded json', () => {
    expect(serializeCookie('themeMode', JSON.stringify('dark'), 365)).toContain('themeMode=%22dark%22');
  });
});
