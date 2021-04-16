/* eslint-disable no-restricted-globals */
/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const createMarkup = (__html) => ({ __html });

// 渲染markdown
const Markdown = ({ html }) => <main className="markdown-body" dangerouslySetInnerHTML={createMarkup(html)} />;

// 渲染md文件列表
const Static = ({ list, onClick }) => (
  <main className="flex flex-column">
    {[...list, { filename: '..', directory: '', type: 'dir' }]
      .map((link: {filename: string, directory: string, type: string}) => {
        const { filename, directory, type } = link;
        return (
          <span
            className={`link hand-cursor color-primary bold no-decoration ${type}`}
            key={filename}
            onClick={() => onClick(`${directory}${filename}`)}
          >
            {filename}
          </span>
        );
      })}
  </main>
);

const HTMLRenderer = ():JSX.Element => {
  const [data, setData] = useState<string>('');
  const [emit, setEmit] = useState<(filename?: string) => void>(() => () => {
    console.warn('pen not connected.');
  });

  useEffect(() => {
    const socket = io(`${location.origin}${location.pathname}`, {
      path: '/pensocket.io',
    });
    socket.on('connect_error', console.error);
    socket.on('pencontent', (serialized: string) => {
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

    // when conneted, emit to get first data
    socket.emit('penfile', '.');

    setEmit(() => (filename: string) => {
      socket.emit('penfile', filename);
      document.title = filename;
    });

    return () => {
      socket.close();
    };
  }, []);

  return (
    <>
      {Array.isArray(data)
        ? <Static list={data} onClick={emit} />
        : <Markdown html={data} />}
      <button className="penback" type="button" onClick={() => emit('..')}>
        {'<-'}
      </button>
    </>
  );
};

export default HTMLRenderer;
