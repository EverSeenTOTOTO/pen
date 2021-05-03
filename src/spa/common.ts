/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-restricted-globals */
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

export const createMarkup = (__html) => ({ __html });

export const usePen = () => {
  const [data, setData] = useState<any>('');
  const [emit, setEmit] = useState<(file?: string) => void>(() => () => {
    console.warn('pen not connected');
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
        setData(e.stack || e.message || `failed to parse pensocket message: ${serialized}`);
      }
    });
    socket.on('penerror', setData);

    // when conneted, emit to get init dir info
    socket.emit('peninit');

    setEmit(() => (filename: string) => {
      socket.emit('penfile', filename);
      document.title = filename;
    });

    return () => {
      socket.close();
    };
  }, []);

  return [data, emit];
};
