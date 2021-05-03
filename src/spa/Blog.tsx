/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable max-len */
/* eslint-disable no-restricted-globals */
import React, { useReducer, useEffect, Reducer } from 'react';
import { Container, Grid } from '@material-ui/core';
import { io, Socket } from 'socket.io-client';

import Markdown from './Markdown';
import Directory, { PenData } from './Directory';

type BlogState = {
  root: string,
  socket: Socket | null,
  dirs: PenData,
  content: string,
};

const initialState: BlogState = {
  root: '',
  socket: null,
  dirs: new Map(),
  content: '<h1>Pen socket not connected.</p>',
};

const reducer: Reducer<BlogState, any> = (state: BlogState, action) => {
  switch (action.type) {
    case 'updateRoot':
      return {
        ...state,
        root: action.payload,
      };
    case 'updateSocket':
      return {
        ...state,
        socket: action.payload,
      };
    case 'updateContent':
      return {
        ...state,
        content: action.payload,
      };
    default:
      return state;
  }
};

const wrapDispatcher = (socket, dispatch) => (evt) => {
  socket.on(evt, (data) => {
    dispatch({
      type: evt,
      payload: data,
    });
  });
};

const Blog = () => {
  const [state, dispatch] = useReducer<Reducer<BlogState, any>>(reducer, initialState);

  useEffect(() => {
    const socket = io(`${location.origin}${location.pathname}`, {
      path: '/pensocket.io',
    });
    const wrap = wrapDispatcher(socket, dispatch);

    wrap('penroot');
    wrap('pendirs');
    wrap('pencontent');

    socket.emit('penroot');

    dispatch({
      type: 'updateSocket',
      payload: socket,
    });

    return () => {
      socket.close();
    };
  }, []);

  const { root, dirs, content } = state;
  const ready = dirs.size > 0; // once ready, size should be > 0

  return (
    <Container>
      <Grid container>
        { ready ?? (
        <Grid item xs={3}>
          <Directory root={root} dirs={dirs} />
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
