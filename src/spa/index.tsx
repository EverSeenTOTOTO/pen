import React from 'react';
import ReactDOM from 'react-dom';
import { ThemeProvider } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';

import './style/fonts.css';
import './style/style.css';

import useTheme from './theme';
import Blog from './Blog';

const App = () => {
  const [theme] = useTheme();

  return (
    <div id="app">
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Blog />
      </ThemeProvider>
    </div>
  );
};

ReactDOM.render(
  <App />,
  document.body,
);
