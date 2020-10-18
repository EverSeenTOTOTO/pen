import React, { useState, useEffect } from 'react';
import SocketClient from './socket-client';

const createMarkup = (__html) => ({ __html });

// 渲染markdown
const Markdown = ({ html }) => <main className="markdown-body" dangerouslySetInnerHTML={createMarkup(html)} />;

// 渲染md文件列表
const Static = ({ list }) => (
  <main className="links">
    {list.map((link) => <a href={link} key={link}>{link}</a>)}
  </main>
);

const HTMLRenderer = ({ location }) => {
  const [data, setData] = useState('');

  useEffect(() => {
    // Set title to Markdown filename
    const pathTokens = location.pathname.split('/');
    document.title = pathTokens[pathTokens.length - 1];

    const socketClient = new SocketClient(location);
    socketClient.ondata = setData;
  }, [location]);

  return Array.isArray(data)
    ? <Static list={data} />
    : <Markdown html={data} />;
};

export default HTMLRenderer;
