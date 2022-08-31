import Clipboard from 'clipboard';
import { useLocation, useNavigate } from 'react-router';
import { useEffect } from 'react';
import { isMarkdown } from '@/utils';
import { useStore } from '.';

export const useClipboard = () => {
  const ui = useStore('ui');

  useEffect(() => {
    // clipboard
    const clipboard = new Clipboard('.copy-btn');

    clipboard.on('success', () => ui.notify('success', 'Copied.'));
    clipboard.on('error', () => ui.notify('error', 'Copy failed.'));

    return () => clipboard.destroy();
  }, []);
};

export const useNav = () => {
  const navigate = useNavigate();
  const ui = useStore('ui');
  const socket = useStore('socket');

  return (relative: string) => {
    navigate(relative);
    if (!socket.socket.connected) {
      ui.notify('error', 'socket not connect');
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
    if (socket.socket.connected) {
      home.fetchData(window.location.pathname);
    }

    if (!isMarkdown(window.location.pathname)) {
      drawer.toggle(true);
    }
  }, [location]);
};
