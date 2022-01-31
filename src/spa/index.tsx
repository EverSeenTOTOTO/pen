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
import './style/style.css';

const Home = observer(() => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: light)');
  const root = useContext(RootContext);
  const themeStyleElementRef = useRef<HTMLStyleElement>();

  useEffect(() => {
    // clipboard
    const clipboard = new Clipboard('.markdown-it-copy-btn');

    clipboard.on('success', () => root.uiStore.notify('success', 'Copied.'));
    clipboard.on('error', () => root.uiStore.notify('error', 'Copy failed.'));

    return () => clipboard.destroy();
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
