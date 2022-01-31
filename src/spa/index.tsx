import CssBaseline from '@material-ui/core/CssBaseline';
import { ThemeProvider } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import { autorun } from 'mobx';
import { observer } from 'mobx-react-lite';
import React, { useContext, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import {
  BrowserRouter, Route, Switch,
} from 'react-router-dom';
import Clipboard from 'clipboard';
import Blog from './Blog';
import RootContext from './stores/index';
import RootStore from './stores/root';
import { DefaultThemeConfig } from './stores/ui';
import './style/style.css';

// clipboard
// eslint-disable-next-line no-new
new Clipboard('.markdown-it-copy-btn');

const Home = observer(() => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: light)');
  const root = useContext(RootContext);
  const themeStyleElementRef = useRef<HTMLStyleElement>();

  useEffect(() => {
    root.socketStore.fetchTheme(DefaultThemeConfig.dark);
  }, []);
  useEffect(() => {
    root.uiStore.toggleDarkMode(prefersDarkMode);
  }, [prefersDarkMode]);
  useEffect(() => autorun(() => {
    if (themeStyleElementRef.current) {
      document.body.removeChild(themeStyleElementRef.current);
    }

    if (root.uiStore.themeStyleScript) {
      const styleElement = document.createElement('style');
      styleElement.innerHTML = root.uiStore.themeStyleScript;
      styleElement.setAttribute('type', 'text/css');

      themeStyleElementRef.current = styleElement;
      document.body.appendChild(styleElement);
    }
  }), []);

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
