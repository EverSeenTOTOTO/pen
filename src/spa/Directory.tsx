/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
} from '@material-ui/core';
import React, {
  useState, useEffect, useCallback, useRef,
} from 'react';
import { Folder, TextFields } from '@material-ui/icons';
import { makeStyles } from '@material-ui/core/styles';
import { Socket } from 'socket.io-client';

export type PenInfo = {
  filename: string,
  relative: string,
  type: 'dir' | 'markdown'
};

const useStyles = makeStyles({
  root: {
    height: '100%',
    overflowY: 'scroll',
  },
});

const isSame = (dirs: PenInfo[], last: PenInfo[]) => {
  if (dirs.length !== last.length) return false;
  for (let i = 0; i < dirs.length; ++i) {
    if (dirs[i].filename !== last[i].filename
      || dirs[i].relative !== last[i].relative
      || dirs[i].type !== last[i].type) {
      return false;
    }
  }
  return true;
};

const Directory = ({ content, dirs, socket }: { content: string, dirs: PenInfo[], socket: Socket }) => {
  const [current, setCurrent] = useState<string>('');
  const dirsRef = useRef<PenInfo[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [stack, setStack] = useState<PenInfo[]>([{ relative: '', filename: '', type: 'dir' }]);
  const classes = useStyles();

  const onClick = useCallback(
    (info: PenInfo) => {
      if (info.type === 'markdown') {
        window.history.pushState(info, info.filename, '');
      }
      socket.emit('peninit', info.relative);
      setStack((stk) => [...stk, info]);
      setCurrent(info.relative);
    },
    [socket],
  );

  useEffect(() => {
    // content不为空说明跨越目录访问md，此时不需要展示一个默认的md
    if (content === '' && !isSame(dirs, dirsRef.current)) {
      dirsRef.current = dirs;
      const mds = dirs.filter((each) => each.type === 'markdown');
      if (mds.length > 0) {
        onClick(mds[0]);
      }
    }
  }, [dirs, content, onClick]);

  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      if (e.state !== null) {
        let last: PenInfo|undefined;

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

  const items = dirs.map((each: PenInfo) => {
    const currentItemClassName = current && current === each.relative ? 'list-item--current' : '';

    return (
      <ListItem
        className={`list-item ripple ${currentItemClassName}`}
        onClick={() => onClick(each)}
      >
        <ListItemAvatar>
          <Avatar>
            { each.type === 'markdown' ? <TextFields /> : <Folder />}
          </Avatar>
        </ListItemAvatar>
        <ListItemText primary={each.filename} />
      </ListItem>
    );
  });

  return (
    <List
      classes={{
        root: classes.root,
      }}
      component="nav"
      aria-labelledby="nested-list-subheader"
    >
      {items}
    </List>
  );
};

export default Directory;
