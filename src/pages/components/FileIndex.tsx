import { observer } from 'mobx-react-lite';
import { useStore } from '@/store';
import { useNav } from '@/store/hooks';
import Icon from './Icon';

/**
 * Shown when a directory page has no README to read: the content area
 * becomes an index of the directory's children instead of dead space —
 * and on mobile it doubles as the primary navigation page.
 */
const FileIndex = observer(() => {
  const home = useStore('home');
  const drawer = useStore('drawer');
  const nav = useNav();

  const entries = drawer.subdirs;

  return (
    <div className="markdown-paper file-index">
      <h2 className="file-index-title">{home.data?.relativePath || '/'}</h2>
      {entries.length === 0
        ? <p className="file-index-empty">Empty directory.</p>
        : (
          <ul className="file-index-grid">
            {entries.map((doc) => (
              <li key={doc.relativePath}>
                <button
                  type="button"
                  className="file-index-item"
                  disabled={home.loading}
                  onClick={() => nav(doc.relativePath)}
                >
                  <Icon name={doc.type === 'directory' ? 'folder' : 'file'} size={18} />
                  <span>{doc.filename}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
    </div>
  );
});

export default FileIndex;
