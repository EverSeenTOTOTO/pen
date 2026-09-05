import { observer } from 'mobx-react-lite';
import { useStore } from '@/store';
import { useNav } from '@/store/hooks';
import Icon from './Icon';
import TocTree from './TocTree';

const Files = observer(() => {
  const home = useStore('home');
  const drawer = useStore('drawer');
  const nav = useNav();

  return (
    <div className="sidebar-files">
      {drawer.subdirs.map((doc) => (
        <button
          key={doc.relativePath}
          type="button"
          className="file-item"
          aria-current={home.reading === doc.relativePath || undefined}
          disabled={home.loading}
          onClick={() => {
            nav(doc.relativePath);
            // on mobile the overlay drawer must dismiss after picking a file
            drawer.closeOverlay();
          }}
        >
          <Icon name={doc.type === 'directory' ? 'folder' : 'file'} size={16} />
          <span className="file-name">{doc.filename}</span>
        </button>
      ))}
    </div>
  );
});

const Sidebar = observer(() => {
  const drawer = useStore('drawer');
  return (
    <aside className="sidebar" data-open={drawer.visible}>
      <Files />
      <TocTree />
      <div className="sidebar-footer">
        <button type="button" className="icon-btn" aria-label="Back to top"
          onClick={() => window.scrollTo({ top: 0 })}>
          <Icon name="arrowUp" />
        </button>
      </div>
    </aside>
  );
});

export default Sidebar;
