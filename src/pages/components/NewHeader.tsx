import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Link } from 'react-router';
import { useStore } from '@/store';
import { useNav } from '@/store/hooks';
import Icon from './Icon';
import ThemeToggle from './Toggle';

// the one sidebar switch: always in the header, icon and action driven by
// state — desktop toggles the persistent sidebar, mobile the overlay drawer.
// the breakpoint lives in state via effect (not render): SSR has no window,
// and the first client render must match the server markup
const MenuToggle = observer(() => {
  const drawer = useStore('drawer');
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(width >= 768px)');
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const open = desktop ? drawer.visible : drawer.overlay;

  return (
    <button
      type="button"
      className="icon-btn menu-toggle"
      aria-label={open ? 'Close menu' : 'Open menu'}
      onClick={() => {
        if (desktop) {
          drawer.toggle(!open);
        } else if (open) {
          drawer.closeOverlay();
        } else {
          drawer.openOverlay();
        }
      }}
    >
      <Icon name={open ? 'chevronLeft' : 'menu'} />
    </button>
  );
});

const NewHeader = observer(() => {
  const ui = useStore('ui');
  const socket = useStore('socket');
  const nav = useNav();

  return (
    <header className="app-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0, flex: 1 }}>
        <MenuToggle />
        <nav className="breadcrumb" aria-label="breadcrumb">
          <Link to={socket.namespace} className="breadcrumb-home" aria-label="Home" onClick={(e) => { e.preventDefault(); nav(socket.namespace); }}>
            <Icon name="home" size={16} />
          </Link>
          {ui.breadcrumb.map((link) => (
            <span key={link.relative} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
              <span className="breadcrumb-sep">/</span>
              <Link to={link.relative} onClick={(e) => { e.preventDefault(); nav(link.relative); }}>
                {link.filename}
              </Link>
            </span>
          ))}
        </nav>
      </div>
      <ThemeToggle />
    </header>
  );
});

export default NewHeader;
