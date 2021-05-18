/* eslint-disable import/prefer-default-export */
import { genStateKey, setStateKey, getStateKey } from './state-key';

export function extend(a, b) {
  for (const key in b) {
    a[key] = b[key];
  }
  return a;
}

export const createMarkup = (__html) => ({ __html });

export function pushState(url?: string, replace?: boolean) {
  // try...catch the pushState call to get around Safari
  // DOM Exception 18 where it limits to 100 pushState calls
  const { history } = window;
  try {
    if (replace) {
      // preserve existing history state as it could be overriden by the user
      const stateCopy = extend({}, history.state);
      stateCopy.key = getStateKey();
      history.replaceState(stateCopy, '', url);
    } else {
      const state = { key: setStateKey(genStateKey()) };
      history.pushState(state, '', url);
    }
  } catch (e) {
    console.error(e);
    window.location[replace ? 'replace' : 'assign'](url);
  }
}

export function getLocation(base: string): string {
  let path = window.location.pathname;
  if (base && path.toLowerCase().indexOf(base.toLowerCase()) === 0) {
    path = path.slice(base.length);
  }
  return (path || '/') + window.location.search + window.location.hash;
}
