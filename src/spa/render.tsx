/* eslint-disable no-restricted-globals */
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const createMarkup = (__html) => ({ __html });

// 渲染markdown
const Markdown = ({ html }) => <main className="markdown-body" dangerouslySetInnerHTML={createMarkup(html)} />;

const getHashUrl = (hash) => (hash === '' ? hash : hash.slice(2));

const handleSlashes = (path) => {
  if (path === '') return path;
  let tmp = path;
  if (path.startsWith('/')) tmp = tmp.substr(1);// 掐头
  return tmp.endsWith('/') ? tmp : `${tmp}/`;// 补尾
};

// 渲染md文件列表
const Static = ({ list }) => (
  <main className="flex flex-column">
    {list.map((link) => {
      const { filename, type } = link;
      const basepath = handleSlashes(getHashUrl(location.hash));
      const href = `#/${basepath}${filename}`;
      return (
        <a
          className={`link hand-cursor color-primary bold no-decoration ${type}`}
          key={filename}
          href={href}
        >
          {filename}
        </a>
      );
    })}
  </main>
);

const HTMLRenderer = ():JSX.Element => {
  const [data, setData] = useState('');

  useEffect(() => {
    document.title = 'Pen';

    const socket = io(`${location.origin}${location.pathname}`, {
      path: '/pensocket.io',
    });
    socket.on('connect_error', console.error);
    socket.on('pencontent', (serialized) => {
      try {
        const content = JSON.parse(serialized);
        setData(content);
      } catch (e) {
        setData(e.stack || e.message || `failed to parse pensocket message ${serialized}`);
      }
    });
    socket.on('penerror', (e) => {
      setData(e.stack || e.message);
    });

    const callback = () => {
      const path = getHashUrl(location.hash);
      socket.emit('penfile', path);
    };
    const timeout = setTimeout(callback, 0);
    window.addEventListener('hashchange', callback);

    return () => {
      socket.close();
      clearTimeout(timeout);
      window.removeEventListener('hashchange', callback);
    };
  }, []);

  return (
    <>
      <span id="pen-scroll-item" />
      {Array.isArray(data)
        ? <Static list={data} />
        : <Markdown html={data} />}
    </>
  );
};

export default HTMLRenderer;
