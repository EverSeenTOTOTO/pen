import { useLocation } from 'react-router';
import { useEffect, useRef } from 'react';
import { useStore } from '.';

export const useTheme = () => {
  const theme = useStore('theme');
  const styleElement = useRef<Element | null>();

  // mobx autorun throw "window undefined" in ssr mode
  useEffect(() => {
    if (styleElement.current) {
      styleElement.current.innerHTML = theme.css;
    } else {
      styleElement.current = window && window.document.querySelector(`#${theme.id}`);
    }
  }, [theme.css, theme.id]);
};

export const useAutoFetch = () => {
  const home = useStore('home');
  const socket = useStore('socket');
  const location = useLocation();

  useEffect(() => {
    console.log(`fetch ${socket.pathname}`);
    home.fetchData(socket.pathname);
  }, [location]);
};
