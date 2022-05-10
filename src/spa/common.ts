import { useContext, useEffect, useRef } from 'react';
import Clipboard from 'clipboard';
import { autorun } from 'mobx';
import RootContext from './stores/index';

export const createMarkup = (__html) => ({ __html });

export const getUpdir = (pathname: string) => {
  const match = /(.*?\/[^/]*)\/[^/]*\/?$/.exec(pathname);

  if (match) {
    return match[1];
  }

  return '/';
};

export const useClipboard = () => {
  const root = useContext(RootContext);

  useEffect(() => {
    // clipboard
    const clipboard = new Clipboard('.markdown-it-copy-btn');

    clipboard.on('success', () => root.uiStore.notify('success', 'Copied.'));
    clipboard.on('error', () => root.uiStore.notify('error', 'Copy failed.'));

    return () => clipboard.destroy();
  }, []);
};

export const useTheme = () => {
  const root = useContext(RootContext);
  const themeStyleElementRef = useRef<HTMLStyleElement>();

  useEffect(() => autorun(() => {
    if (themeStyleElementRef.current) {
      document.head.removeChild(themeStyleElementRef.current);
    }

    if (root.uiStore.themeStyleScript) {
      const styleElement = document.createElement('style');
      styleElement.innerHTML = root.uiStore.themeStyleScript;
      styleElement.setAttribute('type', 'text/css');

      themeStyleElementRef.current = styleElement;
      document.head.appendChild(styleElement);
    }
  }), []);
};

export const useDebouncedEvent = (event: string, closure: (evt: KeyboardEvent) => void, interval = 100) => {
  useEffect(() => {
    let timeout: NodeJS.Timeout|null = null;
    const debounced = (evt: KeyboardEvent) => {
      if (!timeout) {
        closure(evt);
        timeout = setTimeout(() => {
          timeout = null;
        }, interval);
      }
    };

    document.addEventListener(event, debounced);
    return () => {
      clearTimeout(timeout);
      document.removeEventListener(event, debounced);
    };
  }, []);
};
