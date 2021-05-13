/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
} from '@material-ui/core';
import React, { useState, useEffect } from 'react';
import { Folder, TextFields } from '@material-ui/icons';
import { makeStyles } from '@material-ui/core/styles';
import { Socket } from 'socket.io-client';

export type PenInfo = {
  filename: string,
  relative: string,
  type: 'dir' | 'markdown'
};

const useStyles = makeStyles((theme) => ({
  root: {
    height: '100%',
    overflowY: 'scroll',
  },
}));

const Directory = ({ dirs, socket }: { dirs: PenInfo[], socket: Socket }) => {
  const [current, setCurrent] = useState<any>();
  const classes = useStyles();

  useEffect(() => {
    const mds = dirs.filter((each) => each.type === 'markdown');
    if (mds.length > 0) {
      socket.emit('peninit', mds[0].relative);
      setCurrent(mds[0]);
    }
  }, [socket, dirs]);

  const items = dirs.map((each: PenInfo) => {
    const currentItemClassName = current && current.filename === each.filename ? 'list-item--current' : '';

    return (
      <ListItem
        className={`list-item ripple ${currentItemClassName}`}
        onClick={() => {
          socket.emit('peninit', each.relative);
        }}
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
