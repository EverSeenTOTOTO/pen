import React from 'react';
import ReactDOM from 'react-dom';
import {
  BrowserRouter,
  Switch,
  Route,
} from 'react-router-dom';
import {
  observer, useLocalObservable,
} from 'mobx-react-lite';
import { ThemeProvider } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';

import 'github-markdown-css/github-markdown.css';
import 'highlight.js/styles/github.css';
import 'markdown-it-copy/theme/default.css';
import './style/style.css';
import useTheme from './theme';

const TimerView = observer(() => {
  const timer = useLocalObservable(() => ({
    secondsPassed: 0,
    increaseTimer() {
      this.secondsPassed++;
    },
  }));
  return (
    <span>
      Seconds passed:
      {' '}
      {timer.secondsPassed}
    </span>
  );
});

const App = () => {
  const theme = useTheme();

  return (
    <div id="app">
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Switch>
            <Route path="/*">
              <TimerView />
            </Route>
          </Switch>
        </BrowserRouter>
      </ThemeProvider>
    </div>
  );
};

ReactDOM.render(
  <App />,
  document.body,
);
