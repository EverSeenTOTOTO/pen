import { CacheProvider } from '@emotion/react';
import type { EmotionCache } from '@emotion/react';
import { Route, Routes } from 'react-router';
import type { AppRoutes } from './routes';
import { AppStore, RootContext } from './store';

export function App({ store, routes, cache }: { store: AppStore, routes: AppRoutes, cache: EmotionCache }) {
  return (
    <CacheProvider value={cache}>
      <RootContext.Provider value={store}>
        <Routes>
          {routes.map(({ path, component: RouteComp }) => (
            <Route key={path} path={path} element={<RouteComp />} />
          ))}
        </Routes>
      </RootContext.Provider>
    </CacheProvider>
  );
}
