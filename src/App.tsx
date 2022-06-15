import { Route, Routes } from 'react-router-dom';
import { AppRoutes } from './routes';
import { AppStore, RootContext } from './store';

export function App({ store, routes }: { store: AppStore, routes: AppRoutes }) {
  return (
    <>
      <RootContext.Provider value={store}>
        <Routes>
          {routes.map(({ path, component: RouteComp }) => (
            <Route key={path} path={path} element={<RouteComp />} />
          ))}
        </Routes>
      </RootContext.Provider>
    </>
  );
}
