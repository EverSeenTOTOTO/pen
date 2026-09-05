import { observer } from 'mobx-react-lite';
import { Link } from 'react-router';
import { useStore } from '@/store';
import { useNav } from '@/store/hooks';
import Icon from './Icon';
import ThemeToggle from './Toggle';

// mobile-only overlay drawer switch (desktop opens/closes the persistent
// sidebar from the sidebar footer and the collapsed rail) — no window access,
// so server and first client render always match
const MenuToggle = observer(() => {
  const drawer = useStore('drawer');

  return (
    <button
      type="button"
      className="icon-btn menu-toggle"
      aria-label={drawer.overlay ? 'Close menu' : 'Open menu'}
      onClick={() => (drawer.overlay ? drawer.closeOverlay() : drawer.openOverlay())}
    >
      <Icon name={drawer.overlay ? 'chevronLeft' : 'menu'} />
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
