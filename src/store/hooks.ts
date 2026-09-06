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
  }, [home.data]);
};

export const useMermaid = () => {
  const home = useStore('home');
  const theme = useStore('theme');

  useEffect(() => {
    // fresh sources (new document) plus already-rendered hosts (theme flip:
    // the source block was replaced on first render, so the host carries the
    // source in data-mermaid-source for re-rendering)
    const sources = Array.from(document.querySelectorAll<HTMLElement>('code.pen-mermaid-source'));
    const hosts = Array.from(document.querySelectorAll<HTMLElement>('.mermaid-svg[data-mermaid-source]'));
    if (!sources.length && !hosts.length) return;

    let cancelled = false;

    import('mermaid').then(async (mod) => {
      const mermaid = mod.default;
      mermaid.initialize({
        startOnLoad: false,
        theme: theme.mode === 'dark' ? 'dark' : 'default',
      });

      const targets = [
        ...sources.map((el) => ({ el, host: null as HTMLElement | null, source: el.textContent ?? '' })),
        ...hosts.map((host) => ({ el: null as HTMLElement | null, host, source: host.dataset.mermaidSource ?? '' })),
      ];

      for (const [i, { el, host, source }] of targets.entries()) {
        if (cancelled) return;
        // theme in the id: re-renders must not collide with live svgs
        const id = `pen-mermaid-${i}-${theme.mode}`;
        try {
          await mermaid.parse(source); // throws on syntax error
          const { svg } = await mermaid.render(id, source);
          if (cancelled) return;
          const target = host ?? el;
          if (!target) continue;
          if (host) {
            host.innerHTML = svg;
          } else {
            const div = document.createElement('div');
            div.className = 'mermaid-svg';
            div.dataset.mermaidSource = source;
            div.innerHTML = svg;
            target.replaceWith(div);
          }
        } catch (err) {
          const errBox = document.createElement('div');
          errBox.className = 'mermaid-error';
          errBox.textContent = `Mermaid error: ${err instanceof Error ? err.message : String(err)}\n\n${source}`;
          (host ?? el)?.replaceWith(errBox);
        }
      }
    });

    return () => { cancelled = true; };
    // `home.data`, not `home.html`: on a refetch of identical content the
    // html string is unchanged, but the Suspense fallback swapped the DOM —
    // the effect must re-run against the fresh source blocks or a slow
    // `import('mermaid')` resolves against detached nodes (prod chunk load)
  }, [home.data, theme.mode]);
};
