import Clipboard from 'clipboard';
import { useNavigate } from 'react-router';
import { useEffect } from 'react';
import { isMarkdown, stripNamespace } from '@/utils';
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
  const drawer = useStore('drawer');

  return (relative: string) => {
    navigate(relative);
    if (socket.socket.connected) {
      const pathname = stripNamespace(socket.namespace, window.location.pathname);

      if (pathname !== home.reading) {
        console.log(`fetch ${window.location.pathname}`);
        home.fetchData(window.location.pathname);
      }

      if (!isMarkdown(relative)) {
        drawer.toggle(true);
      }
    } else {
      home.notify('error', 'socket not connect');
    }
  };
};

export const useAutoFetch = () => {
  const home = useStore('home');
  const socket = useStore('socket');

  useEffect(() => { // onMounted
    if (socket.socket.connected) {
      home.fetchData(window.location.pathname, false);
    }
  }, []);
};
