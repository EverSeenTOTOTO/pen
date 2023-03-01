import { useLocation, useNavigate } from 'react-router';
import { useEffect } from 'react';
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

export const useDocToc = () => {
  const home = useStore('home');

  useEffect(() => {
    const headers = document.querySelectorAll('h1, h2, h3, h4, h5, h6');

    headers.forEach((h) => {
      const archor = h.querySelector('span:first-of-type');
      const click = h.querySelector('span:last-of-type');

      if (archor && click) {
        click.addEventListener('click', (e) => {
          window.location.hash = archor.id;
          e.preventDefault();
        });
      }
    });
  }, [home.html]);
};
