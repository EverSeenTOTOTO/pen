import Clipboard from 'clipboard';
import { useLocation } from 'react-router';
import { useEffect } from 'react';
import { useStore } from '.';

export const useClipboard = () => {
  const home = useStore('home');

  useEffect(() => {
    // clipboard
    const clipboard = new Clipboard('.copy-btn');

    clipboard.on('success', () => home.notify('success', 'Copied.'));
    clipboard.on('error', () => home.notify('error', 'Copy failed.'));

    return () => clipboard.destroy();
  }, []);
};

export const useAutoFetch = () => {
  const home = useStore('home');
  const socket = useStore('socket');
  const location = useLocation();

  useEffect(() => {
    console.log(`fetch ${socket.pathname}`);
    home.fetchData(socket.pathname);
  }, [location]);
};
