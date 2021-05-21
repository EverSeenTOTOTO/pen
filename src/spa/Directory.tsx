/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
} from '@material-ui/core';
import React, { useState, useEffect, useCallback } from 'react';
import { Folder, TextFields } from '@material-ui/icons';
import { makeStyles } from '@material-ui/core/styles';
import { Socket } from 'socket.io-client';

import { pushState, getLocation } from './common';

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

const Directory = ({ dirs, socket }: { dirs: PenInfo[], socket: Socket }) => {
  const [current, setCurrent] = useState<string>('');
  const classes = useStyles();

  const onClick = useCallback(
    (info: PenInfo & { route?: string}) => {
      info.type === 'markdown' && pushState(info.route);
      socket.emit('peninit', info.relative);
      setCurrent(info.relative);
    },
    [socket],
  );

  useEffect(() => {
    const onPopState = () => {
      const location = getLocation('');
      const route = location.slice(1);

      // 如果所在目录发生变化
      if (!dirs.some((each) => each.relative === route)) {
        const updir = location.slice(0, location.lastIndexOf('/') + 1);
        socket.emit('peninit', updir === '/' ? '.' : updir); // 更新目录
        socket.once('pendirs', () => {
          // 回到上一层目录并且渲染一轮后再查找所历史所打开的文件
          setTimeout(() => {
            onClick({
              filename: location.slice(location.lastIndexOf('/')),
              relative: route,
              type: 'markdown',
            });
          });
        });
      } else {
        socket.emit('peninit', route);
        setCurrent(route);
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [socket, dirs]);

  useEffect(() => {
    const mds = dirs.filter((each) => each.type === 'markdown');
    if (mds.length > 0) {
      onClick(mds[0]);
    }
  }, [socket, dirs]);

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
