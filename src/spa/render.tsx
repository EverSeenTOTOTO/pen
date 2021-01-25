/* eslint-disable no-restricted-globals */
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const createMarkup = (__html) => ({ __html });

// 渲染markdown
const Markdown = ({ html }) => <main className="markdown-body" dangerouslySetInnerHTML={createMarkup(html)} />;

const getHashUrl = (url) => {
  const index = url.indexOf('#');
  if (index >= 0) {
    return url.slice(index + 2);
  }
  return '';
};

const handleSlashes = (path) => {
  if (path === '') return path;
  let tmp = path;
  if (path.startsWith('/')) tmp = tmp.substr(1);
  return tmp.endsWith('/') ? tmp : `${tmp}/`;
};

// 渲染md文件列表
const Static = ({ list }) => (
  <main className="links">
    {list.map((link) => {
      const { filename, type } = link;
      const basepath = handleSlashes(getHashUrl(location.href));
      return (
        <a
          className={type}
          key={filename}
          href={`#/${basepath}${filename}`}
        >
          {filename}
        </a>
      );
    })}
  </main>
);

const HTMLRenderer = ():JSX.Element => {
  const [data, setData] = useState('');
  const [isDirs, setIsDir] = useState(false);

  useEffect(() => {
    document.title = 'Pen';

    const socket = io(location.href, {
      path: '/pensocket.io',
    });
    socket.on('connect_error', console.error);
    socket.on('pencontent', (serialized) => {
      try {
        const content = JSON.parse(serialized);
        setIsDir(Array.isArray(content));
        setData(content);
      } catch (e) {
        setData(e.stack || e.message);
      }
    });
    socket.on('penerror', (e) => setData(e.stack || e.message));

    const callback = (e) => {
      const path = getHashUrl(e.newURL);
      socket.emit('penfile', path);
    };
    window.addEventListener('hashchange', callback);

    return () => {
      socket.close();
      window.removeEventListener('hashchange', callback);
    };
  }, []);

  return (
    <>
      <span id="pen-scroll-item" />
      {isDirs
        ? <Static list={data} />
        : <Markdown html={data} />}
    </>
  );
};

export default HTMLRenderer;
