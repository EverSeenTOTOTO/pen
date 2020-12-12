import 'github-markdown-css/github-markdown.css';
import 'highlight.js/styles/github.css';
import './style.css';

import React from 'react';
import ReactDOM from 'react-dom';
import HTMLRenderer from './render';

ReactDOM.render(
  <div id="app">
    <HTMLRenderer />
  </div>,
  document.body,
);
