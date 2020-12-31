/* eslint-disable no-restricted-globals */
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const createMarkup = (__html) => ({ __html });

// 渲染markdown
const Markdown = ({ html }) => <main className="markdown-body" dangerouslySetInnerHTML={createMarkup(html)} />;

// 渲染md文件列表
const Static = ({ list }) => (
  <main className="links">
    {list.map((link) => {
      const { filename, type } = link;
      return (
        <a
          className={type}
          key={filename}
          href={`#/${filename}`}
        >
          {filename}
        </a>
      );
    })}
  </main>
);

const getHashUrl = (url) => {
  const index = url.indexOf('#');
  if (index >= 0) {
    return url.slice(index + 1);
  }
  return '/';
};

const HTMLRenderer = ():JSX.Element => {
  const [data, setData] = useState('');

  const isDirs = Array.isArray(data);

  useEffect(() => {
    document.title = 'Pen';

    const socket = io(location.href, {
      path: '/pensocket.io',
    });
    socket.on('connect_error', console.error);
    socket.on('pencontent', (serialized) => {
      try {
        setData(JSON.parse(serialized));
      } catch (e) {
        setData(e.message);
      }
    });
    socket.on('penerror', (e) => setData(e.message));

    window.addEventListener('hashchange', (e) => {
      const path = getHashUrl(e.newURL);
      console.log(path);
      socket.emit('penfile', path);
    });

    return () => {
      socket.close();
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
