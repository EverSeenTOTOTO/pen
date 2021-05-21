/* eslint-disable import/prefer-default-export */
import { genStateKey, setStateKey, getStateKey } from './state-key';

export function extend(a, b) {
  for (const key in b) {
    a[key] = b[key];
  }
  return a;
}

export const createMarkup = (__html) => ({ __html });
