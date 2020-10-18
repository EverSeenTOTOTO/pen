// Non-js dependencies
import 'github-markdown-css/github-markdown.css';
import 'highlight.js/styles/foundation.css';
import './style.css';

import React from 'react';
import ReactDOM from 'react-dom';
import HTMLRenderer from './html-renderer';

ReactDOM.render(
  <div id="app">
    <HTMLRenderer location={location} />
  </div>,
  document.body,
);
