import { observer } from 'mobx-react-lite';
import { useStore } from '@/store';
import { createMarkup } from '@/utils';
import { Suspense, useEffect, useRef } from 'react';
import Skeleton from './Skeleton';
import FileIndex from './FileIndex';

const Data = observer(() => {
  const home = useStore('home');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // retrigged via remove + reflow + add so consecutive saves re-animate
    const el = ref.current;
    if (!el || !home.updatedTick) return;
    el.classList.remove('paper-updated');
    void el.offsetWidth;
    el.classList.add('paper-updated');
    const timer = setTimeout(() => el.classList.remove('paper-updated'), 1400);
    return () => clearTimeout(timer);
  }, [home.updatedTick]);

  if (home.loadingTimeout) throw new Promise<void>((res) => res());

  // a directory without a README has nothing to read — index its children
  if (home.data?.type === 'directory' && !home.data.reading) {
    return <FileIndex />;
  }

  return <div ref={ref} className="markdown-paper" dangerouslySetInnerHTML={createMarkup(home.html)} />;
});

const Markdown = observer(() => (
  <div className="markdown-body">
    <Suspense fallback={<Skeleton />}>
      <Data />
    </Suspense>
  </div>
));

export default Markdown;
