/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
} from '@material-ui/core';
import React from 'react';
import { Folder, TextFields } from '@material-ui/icons';
import { makeStyles } from '@material-ui/core/styles';

import { PenDirInfo } from './common';

const useStyles = makeStyles({
  root: {
    height: '100%',
    overflowY: 'scroll',
  },
});

const Directory = ({ files, onClick }: { files: PenDirInfo[], onClick: (info: PenDirInfo) => void }) => {
  const classes = useStyles();

  const items = files.map((each: PenDirInfo) => {
    const currentItemClassName = each.current ? 'list-item--current' : '';

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
