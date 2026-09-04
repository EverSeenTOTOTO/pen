import { useLocation, useNavigate } from 'react-router';
import { useEffect, useTransition } from 'react';
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
  const [, startTransition] = useTransition();

  return (relative: string) => {
    startTransition(() => {
      navigate(relative);
    });
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

export const scrollToHeading = (id: string) => {
  document.getElementById(id)?.scrollIntoView();
  history.replaceState(null, '', `#${id}`);
};

export const useScrollSpy = () => {
  const home = useStore('home');
  const drawer = useStore('drawer');

  useEffect(() => {
    const headers = Array.from(document.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]'));
    if (!headers.length) return;

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible) drawer.setActiveToc(visible.target.id);
    }, { rootMargin: '-64px 0px -70% 0px' });

    headers.forEach((header) => observer.observe(header));
    return () => observer.disconnect();
  }, [home.html]);
};
