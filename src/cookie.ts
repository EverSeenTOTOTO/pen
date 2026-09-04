export const parseCookies = (cookieString: string): Record<string, string> =>
  Object.fromEntries(
    cookieString
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const eq = part.indexOf('=');
        return eq === -1 ? [part, ''] : [part.slice(0, eq), decodeURIComponent(part.slice(eq + 1))];
      }),
  );

export const serializeCookie = (key: string, value: string, days = 365) =>
  `${key}=${encodeURIComponent(value)}; max-age=${days * 86400}; path=/; samesite=lax`;

export const getCookie = (key: string): string | undefined => parseCookies(document.cookie)[key];

export const getCookieJson = <T>(key: string): T | undefined => {
  const raw = getCookie(key);
  if (raw === undefined) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
};

export const setCookieJson = (key: string, value: unknown, days = 365) => {
  document.cookie = serializeCookie(key, JSON.stringify(value), days);
};
