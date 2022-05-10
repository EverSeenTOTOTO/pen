import CssBaseline from '@material-ui/core/CssBaseline';
import { ThemeProvider } from '@material-ui/core/styles';
import { observer } from 'mobx-react-lite';
import React, { useContext } from 'react';
import ReactDOM from 'react-dom';
import {
  BrowserRouter, Route, Switch,
} from 'react-router-dom';
import Blog from './Blog';
import RootContext from './stores/index';
import RootStore from './stores/root';
import './style/style.css';
import { useClipboard, useTheme } from './common';

const Home = observer(() => {
  const root = useContext(RootContext);

  useClipboard();
  useTheme();

  return (
    <ThemeProvider theme={root.uiStore.theme}>
      <CssBaseline />
      <BrowserRouter>
        <Switch>
          <Route path="/*">
            <Blog />
          </Route>
        </Switch>
      </BrowserRouter>
    </ThemeProvider>
  );
});

const App = () => {
  const root = new RootStore();

  return (
    <div id="app">
      <RootContext.Provider value={root}>
        <Home />
      </RootContext.Provider>
    </div>
  );
};

ReactDOM.render(
  <App />,
  document.body,
);
