/* eslint-disable no-restricted-globals */
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const createMarkup = (__html) => ({ __html });

// 渲染markdown
const Markdown = ({ html }) => <main className="markdown-body" dangerouslySetInnerHTML={createMarkup(html)} />;

// 渲染md文件列表
const Static = ({ client, list }) => (
  <main className="links">
    {list.length > 0 ? list.map((link) => {
      const { filename, type } = link;
      return (
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions
        <span
          className={type}
          key={filename}
          onClick={() => client.emit('penfile', filename)}
          onKeyUp={() => {}}
        >
          {filename}
        </span>
      );
    }) : (
      <section className="nofile">
        <span>{'No markdown files in '}</span>
        {location.pathname}
      </section>
    )}
  </main>
);

const HTMLRenderer = () => {
  const [data, setData] = useState('');
  const [client, setClient] = useState(null);

  useEffect(() => {
    // Set title to Markdown filename
    const pathTokens = location.pathname.split('/');
    document.title = pathTokens[pathTokens.length - 1];

    const socket = io(location.pathname, {
      path: '/pensocket.io',
    });
    socket.on('pencontent', (serialized) => {
      try {
        setData(JSON.parse(serialized));
      } catch (e) {
        setData(e.message);
      }
    });
    socket.on('penerror', (e) => setData(e.message));
    setClient(socket);
    return () => {
      socket.disconnect();
      socket.close();
    };
  }, []);

  return Array.isArray(data)
    ? <Static client={client} list={data} />
    : <Markdown html={data} />;
};

export default HTMLRenderer;
