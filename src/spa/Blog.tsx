/* eslint-disable max-len */
import React from 'react';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import { io } from 'socket.io-client';
import { useLocation } from 'react-router';

import Markdown from './Markdown';
import Drawer from './Drawer';
import BottomNavigation from './BottomNavigation';
import BreadCrumbRoutes from './Breadcrumbs';
import {
  reducer,
  initialState,
  initMermaid,
  useToggleHandler,
  PenConstants,
} from './common';

const useStyles = makeStyles(() => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
  },
  markdown: {
    flexGrow: 1,
  },
}));

const Blog = () => {
  const classes = useStyles();
  const theme = useTheme();
  const { pathname } = useLocation();
  const [
    {
      files, content, open, socket, current,
    },
    dispatch,
  ] = React.useReducer(reducer, initialState);
  const toggleDrawer = useToggleHandler(dispatch);

  React.useEffect(() => {
    const closure = (evt: KeyboardEvent) => {
      if (evt.code === 'Enter') {
        toggleDrawer()();
      }
    };

    document.addEventListener('keyup', closure);

    return () => document.removeEventListener('keyup', closure);
  }, [toggleDrawer]);

  React.useEffect(() => {
    window.scrollTo(0, 0);

    if (socket && socket.connect) {
      socket.emit(PenConstants.EmitFile, pathname.substr(1));
    }
  }, [pathname, socket]);

  React.useEffect(() => {
    const sock = io({
      path: '/pensocket.io',
    });

    sock.on(PenConstants.ErrorOccured, (data) => {
      dispatch({
        type: PenConstants.ErrorOccured,
        payload: data,
      });
    });

    dispatch({
      type: PenConstants.CreateSocket,
      payload: sock,
    });

    return () => {
      sock.close();
    };
  }, [theme]);

  React.useEffect(() => {
    if (socket && socket.connect) {
      socket.off(PenConstants.UpdateData);
      socket.on(PenConstants.UpdateData, (data) => {
        const payload = JSON.parse(data);

        dispatch({
          type: PenConstants.UpdateData,
          payload,
        });

        initMermaid(theme.palette.type === 'dark');
      });
    }
  }, [socket, theme]);

  return (
    <main className={classes.root}>
      <Drawer open={open} toggleDrawer={toggleDrawer} files={files} current={current} />
      <div className={classes.markdown}>
        <BreadCrumbRoutes toggleDrawer={toggleDrawer} />
        <Markdown html={content} />
      </div>
      <BottomNavigation />
    </main>
  );
};

export default Blog;
