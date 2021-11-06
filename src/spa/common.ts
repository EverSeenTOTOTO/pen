export const createMarkup = (__html) => ({ __html });

export const getUpdir = (pathname: string) => {
  const match = /(.*?\/[^/]*)\/[^/]*\/?$/.exec(pathname);

  if (match) {
    return match[1];
  }

  return '/';
};
