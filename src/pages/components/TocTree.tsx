import { observer } from 'mobx-react-lite';
import type { DocToc } from '@/types';
import { useStore } from '@/store';
import { scrollToHeading } from '@/store/hooks';
import Icon from './Icon';

const TocNode = observer(({ node, depth = 0 }: { node: DocToc; depth?: number }) => {
  const drawer = useStore('drawer');
  const expanded = drawer.expandedToc.includes(node.id);
  const hasChildren = node.children.length > 0;

  return (
    <li className="toc-node">
      <div className="toc-row" style={{ paddingInlineStart: depth * 14 }}>
        {hasChildren
          ? (
            <button
              type="button"
              className="toc-toggle"
              aria-label={expanded ? `Collapse ${node.text}` : `Expand ${node.text}`}
              aria-expanded={expanded}
              onClick={() => drawer.toggleToc(node.id)}
            >
              <Icon name={expanded ? 'chevronDown' : 'chevronRight'} size={14} />
            </button>
          )
          : <span className="toc-toggle toc-toggle-leaf" />}
        <a
          className={`toc-link ${drawer.activeToc === node.id ? 'toc-link-active' : ''}`}
          href={`#${node.id}`}
          onClick={(e) => { e.preventDefault(); scrollToHeading(node.id); }}
        >
          {node.text}
        </a>
      </div>
      {hasChildren && expanded && (
        <ul className="toc-children">
          {node.children.map((child) => <TocNode key={child.id} node={child} depth={depth + 1} />)}
        </ul>
      )}
    </li>
  );
});

const TocTree = observer(() => {
  const drawer = useStore('drawer');
  const toc = drawer.toc;
  if (!toc.length) return null;
  return (
    <nav className="sidebar-toc" aria-label="Table of contents">
      <div className="sidebar-toc-title">Contents</div>
      <ul className="toc">
        {toc.map((node) => <TocNode key={node.id} node={node} />)}
      </ul>
    </nav>
  );
});

export default TocTree;
