import { useLocation, useNavigate } from 'react-router';
import { useEffect } from 'react';
import { reaction } from 'mobx';
import { useStore } from '.';

export const useClipboard = () => {
  const ui = useStore('ui');

  useEffect(() => {
    import('clipboard').then((mod) => mod.default).then((Clipboard) => {
      // clipboard
      const clipboard = new Clipboard('.copy-btn');

      clipboard.on('success', () => ui.notify('success', 'Copied.'));
      clipboard.on('error', () => ui.notify('error', 'Copy failed.'));

      return () => clipboard.destroy();
    });
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

  useEffect(() => { // onMounted
    if (socket.socket.connected) {
      home.fetchData(location.pathname, false);
    }
  }, []);

  useEffect(() => {
    if (socket.socket.connected) {
      home.fetchData(location.pathname);
    }
  }, [location.pathname]);
};

export const useCookie = () => {
  const cookie = useStore('cookie');
  const drawer = useStore('drawer');

  useEffect(() => {
    const data = cookie.load();

    drawer.toggle(data.drawerVisible);
    reaction(() => cookie.data, () => cookie.save());
  }, []);
};
