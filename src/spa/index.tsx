import CssBaseline from '@material-ui/core/CssBaseline';
import { ThemeProvider } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import { runInAction } from 'mobx';
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  BrowserRouter, Route, Switch,
} from 'react-router-dom';
import Blog from './Blog';
import RootContext from './stores/index';
import RootStore from './stores/root';

import 'github-markdown-css/github-markdown.css';
import 'highlight.js/styles/github.css';
import 'markdown-it-copy/theme/default.css';
import './style/style.css';

const App = () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const root = new RootStore();

  useEffect(() => {
    runInAction(() => {
      root.uiStore.darkMode = prefersDarkMode;
    });
  }, [prefersDarkMode]);

  return (
    <div id="app">
      <RootContext.Provider value={root}>
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
      </RootContext.Provider>
    </div>
  );
};

ReactDOM.render(
  <App />,
  document.body,
);
