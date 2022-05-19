import Clipboard from 'clipboard';
import { useLocation, useNavigate } from 'react-router';
import { useEffect } from 'react';
import { isMarkdown } from '@/utils';
import { useStore } from '.';

export const useMUIServerStyle = () => {
  const theme = useStore('theme');

  useEffect(() => {
    if (theme.id.startsWith('UUID')) {
      const jssStyles = document.getElementById(`MUI${theme.id}`);
      if (jssStyles) {
        jssStyles?.parentElement?.removeChild(jssStyles);
      }
    }
  }, [theme.name, theme.id]);
};

export const useClipboard = () => {
  const home = useStore('home');

  useEffect(() => {
    // clipboard
    const clipboard = new Clipboard('.copy-btn');

    clipboard.on('success', () => home.notify('success', 'Copied.'));
    clipboard.on('error', () => home.notify('error', 'Copy failed.'));

    return () => clipboard.destroy();
  }, []);
};

export const useNav = () => {
  const navigate = useNavigate();
  const home = useStore('home');
  const socket = useStore('socket');

  return (relative: string) => {
    navigate(relative);
    if (!socket.socket.connected) {
      home.notify('error', 'socket not connect');
    }
  };
};

export const useAutoFetch = () => {
  const home = useStore('home');
  const socket = useStore('socket');
  const location = useLocation();
  const drawer = useStore('drawer');

  useEffect(() => { // onMounted
    if (socket.socket.connected) {
      home.fetchData(window.location.pathname, false);
    }
  }, []);

  useEffect(() => {
    if (socket.socket.connected && window.location.pathname !== home.reading) {
      console.log(`fetch ${window.location.pathname}`);
      home.fetchData(window.location.pathname);
    }

    if (!isMarkdown(window.location.pathname)) {
      drawer.toggle(true);
    }
  }, [location]);
};
