import { observer } from 'mobx-react-lite';
import { useStore } from '@/store';
import { createMarkup } from '@/utils';
import { Suspense, useRef } from 'react';
import Skeleton from './Skeleton';

const Data = observer(() => {
  const home = useStore('home');
  const ref = useRef(null);

  if (home.loadingTimeout) throw new Promise<void>((res) => res());

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
