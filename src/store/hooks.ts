import { useLocation, useNavigate } from 'react-router';
import { useEffect, useTransition } from 'react';
import { useStore } from '.';

export const useClipboard = () => {
  const ui = useStore('ui');

  useEffect(() => {
    // rehype-copy renders `.copy-btn[data-clipboard-text]` on the server;
    // delegate clicks and use the native clipboard api
    const handler = async (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest?.('.copy-btn[data-clipboard-text]');
      if (!btn) return;
      const text = (btn as HTMLElement).dataset.clipboardText ?? '';
      try {
        await navigator.clipboard.writeText(text);
        ui.notify('success', 'Copied.');
      } catch {
        ui.notify('error', 'Copy failed.');
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
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

export const useMermaid = () => {
  const home = useStore('home');
  const theme = useStore('theme');

  useEffect(() => {
    const blocks = Array.from(document.querySelectorAll<HTMLElement>('code.pen-mermaid-source'));
    if (!blocks.length) return;

    let cancelled = false;

    import('mermaid').then(async (mod) => {
      const mermaid = mod.default;
      mermaid.initialize({
        startOnLoad: false,
        theme: theme.mode === 'dark' ? 'dark' : 'default',
      });

      for (const [i, block] of blocks.entries()) {
        if (cancelled) return;
        const source = block.textContent ?? '';
        const id = `pen-mermaid-${i}`;
        try {
          await mermaid.parse(source); // throws on syntax error
          const { svg } = await mermaid.render(id, source);
          const host = document.createElement('div');
          host.className = 'mermaid-svg';
          host.innerHTML = svg;
          block.replaceWith(host);
        } catch (err) {
          const errBox = document.createElement('div');
          errBox.className = 'mermaid-error';
          errBox.textContent = `Mermaid error: ${err instanceof Error ? err.message : String(err)}\n\n${source}`;
          block.replaceWith(errBox);
        }
      }
    });

    return () => { cancelled = true; };
  }, [home.html, theme.mode]);
};
