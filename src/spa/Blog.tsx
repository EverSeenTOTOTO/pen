/* eslint-disable max-len */
import React from 'react';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import { io } from 'socket.io-client';

import Markdown from './Markdown';
import Drawer from './Drawer';
import BottomNavigation from './BottomNavigation';
import BreadCrumbRoutes from './Breadcrumbs';
import {
  reducer,
  initMermaid,
  initialState,
  useToggleHandler,
  usePathname,
  PenConstants,
} from './common';

const useStyles = makeStyles(() => ({
  root: {
    display: 'flex',
  },
  markdown: {
    flexGrow: 1,
  },
}));

const Blog = () => {
  const classes = useStyles();
  const theme = useTheme();
  const [
    {
      files, content, open, socket,
    },
    dispatch,
  ] = React.useReducer(reducer, initialState);
  const toggleDrawer = useToggleHandler(dispatch);
  const stack = usePathname(socket);

  React.useEffect(() => {
    if (!content) {
      toggleDrawer(true);
    }
  }, [content, toggleDrawer]);

  React.useEffect(() => {
    const sock = io({
      path: '/pensocket.io',
    });

    sock.on(PenConstants.ErrorOccured, (data) => {
      dispatch({
        type: PenConstants.ErrorOccured,
        payload: JSON.parse(data),
      });
    });
    sock.on(PenConstants.UpdateData, (data) => {
      const payload = JSON.parse(data);

      dispatch({
        type: PenConstants.UpdateData,
        payload,
      });

      initMermaid(theme.palette.type === 'dark');
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
    const current = files.filter((each) => each.current)[0];

    if (current) {
      window.history.pushState(current, current.filename, `/${current.relative}`);
    }
  }, [files]);

  return (
    <main className={classes.root}>
      <Drawer open={open} toggleDrawer={toggleDrawer} files={files} />
      <div className={classes.markdown}>
        <BreadCrumbRoutes stack={stack} />
        <Markdown html={content} />
      </div>
      <BottomNavigation toggleMenu={toggleDrawer} />
    </main>
  );
};

export default Blog;
