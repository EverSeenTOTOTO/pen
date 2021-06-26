/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable max-len */
/* eslint-disable no-restricted-globals */
import React, {
  useState, useCallback, useReducer, useEffect,
} from 'react';
import { Container, Grid } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { io } from 'socket.io-client';
import mermaid from 'mermaid';

import Markdown from './Markdown';
import Directory from './Directory';
import {
  reducer, initialState, PenEvents, PenDirInfo,
} from './common';

const useStyles = makeStyles({
  root: {
    paddingLeft: 0,
    paddingRight: 0,
  },
  dir: {
    height: '100vh',
  },
  markdown: {
    height: '100vh',
  },
});

const Blog = () => {
  const classes = useStyles();
  const [state, dispatch] = useReducer<typeof reducer>(reducer, initialState);
  const {
    files, content, socket,
  } = state;
  const [stack, setStack] = useState<PenDirInfo[]>([]);

  const onClick = useCallback(
    (info: PenDirInfo) => {
      if (info.current || !socket) return;
      window.history.pushState(info, info.filename, '');
      socket.emit('peninit', info.relative);
      setStack((stk) => [...stk, info]);
    },
    [socket],
  );

  useEffect(() => {
    console.log('current stack: ');
    console.log(stack);
  }, [stack]);

  useEffect(() => {
    // init with root
    onClick({
      relative: './', filename: '', type: 'dir', current: false,
    });
  }, [onClick]);

  useEffect(() => {
    const sock = io(`${location.origin}${location.pathname}`, {
      path: '/pensocket.io',
    });

    sock.on(PenEvents.UpdateData, (data) => {
      dispatch({
        type: PenEvents.UpdateData,
        payload: JSON.parse(data),
      });
      requestAnimationFrame(() => {
        mermaid.initialize({
          // startOnLoad: true,
          theme: 'default',
          gantt: {
            axisFormatter: [
              ['%Y-%m-%d', (d) => {
                return d.getDay() === 1;
              }],
            ],
          },
        });
        mermaid.init();
      });
    });

    sock.on(PenEvents.ErrorOccured, (data) => {
      dispatch({
        type: PenEvents.ErrorOccured,
        payload: JSON.parse(data),
      });
    });

    dispatch({
      type: PenEvents.CreateSocket,
      payload: sock,
    });

    import('./style/katex.min.css');
    import('github-markdown-css/github-markdown.css');
    import('highlight.js/styles/github.css');
    import('./style/mdit-copy.css');

    return () => {
      sock.close();
    };
  }, []);

  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      if (e.state !== null) {
        let last: PenDirInfo|undefined;

        setStack((stk) => {
          stk.pop();
          last = stk.pop();
          return stk;
        });

        if (last) {
          onClick(last);
        }
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [onClick]);

  return (
    <Container
      maxWidth={false}
      classes={{
        root: classes.root,
      }}
    >
      <Grid container>
        { files?.length > 0 && (
        <Grid
          item
          xs={3}
          classes={{
            root: classes.dir,
          }}
        >
          <Directory onClick={onClick} files={files} />
        </Grid>
        )}
        <Grid
          item
          xs={files?.length > 0 ? 9 : 12}
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
