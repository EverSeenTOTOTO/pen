import { observer } from 'mobx-react-lite';
import clsx from 'clsx';
import { useStore } from '@/store';
import {
  useAutoFetch, useClipboard, useMermaid, useScrollSpy,
} from '@/store/hooks';
import Sidebar, { SidebarRail } from './components/Sidebar';
import NewHeader from './components/NewHeader';
import Markdown from './components/Markdown';
import Toast from './components/Toast';

const Home = observer(() => {
  const drawer = useStore('drawer');

  useAutoFetch();
  useClipboard();
  useScrollSpy();
  useMermaid();

  return (
    <div className={clsx('app', {
      'app-sidebar-open': drawer.visible,
      'app-overlay-open': drawer.overlay,
    })}>
      <div className="app-backdrop" onClick={() => drawer.closeOverlay()} />
      <Sidebar />
      <SidebarRail />
      <div className="app-main">
        <NewHeader />
        <Markdown />
      </div>
      <Toast />
    </div>
  );
});

export default Home;
