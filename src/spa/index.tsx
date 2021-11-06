import CssBaseline from '@material-ui/core/CssBaseline';
import { ThemeProvider } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import 'github-markdown-css/github-markdown.css';
import { observer } from 'mobx-react-lite';
import React, { useContext, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  BrowserRouter, Route, Switch,
} from 'react-router-dom';
import Blog from './Blog';
import RootContext from './stores/index';
import RootStore from './stores/root';
import './style/style.css';

const Home = observer(() => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const root = useContext(RootContext);

  useEffect(() => {
    root.uiStore.toggleDarkMode(prefersDarkMode);
  }, [prefersDarkMode]);

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
