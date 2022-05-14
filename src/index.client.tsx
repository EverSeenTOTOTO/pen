import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { createRoutes } from './routes';
import { createStore } from './store';

import './styles/index.scss';

const container = document.getElementById('root');
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(container!);
const store = createStore();
const routes = createRoutes();

if (window.__PREFETCHED_STATE__) {
  if (import.meta.env.DEV) {
    console.log('prefetched state', window.__PREFETCHED_STATE__);
  }
  // merge ssr prefetched data
  store.hydrate(window.__PREFETCHED_STATE__);
  delete window.__PREFETCHED_STATE__;
}

root.render(<BrowserRouter>
    <App store={store} routes={routes}/>
  </BrowserRouter>);