/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable max-len */
/* eslint-disable no-restricted-globals */
import React, { useReducer, useEffect, Reducer } from 'react';
import { Container, Grid } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { io, Socket } from 'socket.io-client';

import Markdown from './Markdown';
import Directory, { PenInfo } from './Directory';

type BlogState = {
  socket: Socket | null,
  dirs: PenInfo[],
  content: string,
};

const initialState: BlogState = {
  socket: null,
  dirs: [],
  content: '<h1>Pen socket not connected.</p>',
};

const reducer: Reducer<BlogState, any> = (state: BlogState, action) => {
  switch (action.type) {
    case 'pensocket':
      return {
        ...state,
        socket: action.payload,
      };
    case 'penerror':
    case 'pencontent':
      return {
        ...state,
        content: action.payload,
      };
    case 'pendirs':
      return {
        ...state,
        dirs: action.payload,
      };
    default:
      return state;
  }
};

const wrapDispatcher = (socket, dispatch) => (evt) => {
  socket.on(evt, (data) => {
    dispatch({
      type: evt,
      payload: JSON.parse(data),
    });
  });
};

const useStyles = makeStyles({
  root: {
    paddingLeft: 0,
    paddingRight: 0,
  },
  markdown: {
    height: '100vh',
  },
});

const Blog = () => {
  const classes = useStyles();
  const [state, dispatch] = useReducer<Reducer<BlogState, any>>(reducer, initialState);
  const {
    dirs, content, socket,
  } = state;

  useEffect(() => {
    const sock = io(`${location.origin}${location.pathname}`, {
      path: '/pensocket.io',
    });
    const wrap = wrapDispatcher(sock, dispatch);

    wrap('pendirs');
    wrap('pencontent');
    wrap('penerror');

    sock.emit('peninit');

    dispatch({
      type: 'pensocket',
      payload: sock,
    });

    return () => {
      sock.close();
    };
  }, []);

  const ready = dirs.length > 0; // once ready, size should be > 0

  return (
    <Container
      maxWidth={false}
      classes={{
        root: classes.root,
      }}
    >
      <Grid container>
        { ready && (
        <Grid
          item
          xs={2}
        >
          <Directory socket={socket} dirs={dirs} />
        </Grid>
        )}
        <Grid
          item
          xs={ready ? 10 : 12}
          spacing={2}
          classes={{
            root: classes.markdown,
          }}
        >
          <Markdown html={content} />
        </Grid>
      </Grid>
    </Container>
  );
};

export default Blog;
