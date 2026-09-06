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

/**
 * In-page media viewer: the `.mermaid-expand` button on rendered diagrams
 * and clicks on content images open the element on a full-viewport overlay —
 * wheel zoom anchored at the cursor, drag to pan, Esc / toolbar to close.
 * DOM-imperative because the content lives inside dangerouslySetInnerHTML;
 * everything is delegated or on the overlay itself, so re-rendered hosts
 * keep working.
 */
export const useMediaViewer = () => {
  useEffect(() => {
    let scale = 1;
    let tx = 0;
    let ty = 0;
    let overlay: HTMLElement | null = null;
    let stage: HTMLElement | null = null;
    let zoomLabel: HTMLElement | null = null;

    const apply = () => {
      if (!stage) return;
      stage.style.transform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(${scale})`;
      if (zoomLabel) zoomLabel.textContent = `${Math.round(scale * 100)}%`;
    };

    const reset = (initial?: { w: number, h: number }) => {
      // fit the diagram to the viewport in BOTH directions — small diagrams
      // are enlarged to fill ~85%, large ones shrunk (vectors stay crisp)
      if (initial) {
        const fit = Math.min((innerWidth * 0.85) / initial.w, (innerHeight * 0.8) / initial.h);
        scale = Math.min(8, Math.max(0.15, fit));
      } else {
        scale = 1;
      }
      tx = 0;
      ty = 0;
      apply();
    };

    const close = () => {
      overlay?.removeEventListener('wheel', onWheel);
      document.removeEventListener('keydown', onKeydown);
      document.documentElement.classList.remove('pen-viewer-open');
      overlay?.remove();
      overlay = null;
      stage = null;
      zoomLabel = null;
    };

    const zoomAt = (clientX: number, clientY: number, factor: number) => {
      const next = Math.min(8, Math.max(0.15, scale * factor));
      if (next === scale) return;
      // keep the point under the cursor fixed: the stage is anchored at the
      // viewport center pre-transform, so work in cursor-relative coords
      const dx = clientX - innerWidth / 2 - tx;
      const dy = clientY - innerHeight / 2 - ty;
      tx = clientX - innerWidth / 2 - (dx / scale) * next;
      ty = clientY - innerHeight / 2 - (dy / scale) * next;
      scale = next;
      apply();
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.15 : 1 / 1.15);
    };

    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };

    const open = (source: Element) => {
      close();

      overlay = document.createElement('div');
      overlay.className = 'mermaid-viewer';
      stage = document.createElement('div');
      stage.className = 'mermaid-viewer-stage';

      if (source.tagName === 'IMG') {
        // content image lightbox: size from the natural dimensions so the
        // fit calculation and pan math work on stable geometry
        const img = source.cloneNode(true) as HTMLImageElement;
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        if (w) img.style.width = `${w}px`;
        if (h) img.style.height = `${h}px`;
        stage.appendChild(img);
      } else {
        const svg = source.querySelector('svg');
        if (!svg) {
          overlay.remove();
          overlay = null;
          return;
        }
        const clone = svg.cloneNode(true) as SVGSVGElement;
        // mermaid ships an inline `max-width: <natural>px` that stylesheet
        // rules cannot beat — clear it and size from the viewBox so the clone
        // lays out at its natural geometry instead of a squeezed 100%-width
        clone.style.maxWidth = 'none';
        const viewBox = clone.getAttribute('viewBox')?.trim().split(/\s+/);
        if (viewBox && viewBox.length === 4) {
          clone.style.width = `${Number.parseFloat(viewBox[2])}px`;
          clone.style.height = `${Number.parseFloat(viewBox[3])}px`;
        }
        stage.appendChild(clone);
      }

      const toolbar = document.createElement('div');
      toolbar.className = 'mermaid-viewer-toolbar';
      zoomLabel = document.createElement('span');
      zoomLabel.className = 'mermaid-viewer-zoom';
      const mkBtn = (label: string, glyph: string, onClick: () => void) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'icon-btn';
        b.setAttribute('aria-label', label);
        b.textContent = glyph;
        b.addEventListener('click', (e) => { e.stopPropagation(); onClick(); });
        return b;
      };
      toolbar.append(
        mkBtn('Zoom in', '+', () => zoomAt(innerWidth / 2, innerHeight / 2, 1.25)),
        zoomLabel,
        mkBtn('Zoom out', '−', () => zoomAt(innerWidth / 2, innerHeight / 2, 1 / 1.25)),
        mkBtn('Reset zoom', '⤢', () => reset()),
        mkBtn('Close viewer', '✕', close),
      );

      const hint = document.createElement('div');
      hint.className = 'mermaid-viewer-hint';
      hint.textContent = 'esc to close · wheel to zoom · drag to pan';

      overlay.append(stage, toolbar, hint);
      // clicking never exits (a stray click while inspecting details must
      // not throw the viewer away) — Esc and the toolbar close button do.
      // wheel zooms; pointerdown anywhere pans, so dragging works from the
      // backdrop too, not only when grabbing the diagram itself
      overlay.addEventListener('wheel', onWheel, { passive: false });
      overlay.addEventListener('pointerdown', (e) => {
        if ((e.target as HTMLElement).closest('.mermaid-viewer-toolbar')) return;
        e.preventDefault();
        overlay?.setPointerCapture(e.pointerId);
        const start = { x: e.clientX - tx, y: e.clientY - ty };
        const onMove = (ev: PointerEvent) => {
          tx = ev.clientX - start.x;
          ty = ev.clientY - start.y;
          apply();
        };
        const onUp = () => {
          overlay?.releasePointerCapture(e.pointerId);
          overlay?.removeEventListener('pointermove', onMove);
          overlay?.removeEventListener('pointerup', onUp);
        };
        overlay?.addEventListener('pointermove', onMove);
        overlay?.addEventListener('pointerup', onUp);
      });
      document.addEventListener('keydown', onKeydown);

      document.documentElement.classList.add('pen-viewer-open');
      document.body.appendChild(overlay);

      requestAnimationFrame(() => {
        const rect = stage.getBoundingClientRect();
        reset({ w: rect.width, h: rect.height });
      });
    };

    const onRootClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const btn = target.closest?.('.mermaid-expand');
      if (btn) {
        const host = btn.closest('.mermaid-svg');
        if (host) open(host);
        return;
      }
      // content images get the lightbox instead of bare navigation — even
      // when wrapped in a link
      const img = target.closest?.('.markdown-body img');
      if (img) {
        e.preventDefault();
        open(img);
      }
    };
    document.addEventListener('click', onRootClick);

    return () => {
      document.removeEventListener('click', onRootClick);
      close();
    };
  }, []);
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

const EXPAND_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>';

/** corner affordance opening the diagram in the in-page viewer */
const attachExpandButton = (host: HTMLElement) => {
  if (host.querySelector('.mermaid-expand')) return;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'mermaid-expand';
  btn.setAttribute('aria-label', 'Expand diagram');
  btn.innerHTML = EXPAND_ICON;
  host.appendChild(btn);
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
            attachExpandButton(host);
          } else {
            const div = document.createElement('div');
            div.className = 'mermaid-svg';
            div.dataset.mermaidSource = source;
            div.innerHTML = svg;
            attachExpandButton(div);
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
