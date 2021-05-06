/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable max-len */
/* eslint-disable no-restricted-globals */
import React, { useReducer, useEffect, Reducer } from 'react';
import { Container, Grid } from '@material-ui/core';
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

const Blog = () => {
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

  useEffect(() => {
    const mds = dirs.filter((each) => each.type === 'markdown');
    if (mds.length > 0) {
      socket.emit('peninit', mds[0].filename);
    }
  }, [socket, dirs]);
  const ready = dirs.length > 0; // once ready, size should be > 0

  return (
    <Container>
      <Grid container>
        { ready && (
        <Grid item xs={3}>
          <Directory dirs={dirs} />
        </Grid>
        )}
        <Grid item xs={ready ? 9 : 12}>
          <Markdown html={content} />
        </Grid>
      </Grid>
    </Container>
  );
};

export default Blog;
