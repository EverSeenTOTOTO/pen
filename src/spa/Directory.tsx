/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemAvatar,
  ListItemText,
  Avatar,
} from '@material-ui/core';
import React from 'react';
import { Folder, TextFields } from '@material-ui/icons';

export type PenInfo = {
  filename: string,
  type: 'dir' | 'markdown'
};

const Directory = ({ dirs }: { dirs: PenInfo[] }) => {
  console.log(dirs);
  const items = dirs.map((each: PenInfo) => {
    if (each.type === 'markdown') {
      return (
        <ListItem>
          <ListItemIcon>
            <TextFields />
          </ListItemIcon>
          <ListItemText primary={each.filename} />
        </ListItem>
      );
    }

    return (
      <ListItem>
        <ListItemAvatar>
          <Avatar>
            <Folder />
          </Avatar>
        </ListItemAvatar>
        <ListItemText primary={each.filename} />
      </ListItem>
    );
  });

  return (
    <List
      component="nav"
      aria-labelledby="nested-list-subheader"
    >
      {items}
    </List>
  );
};

export default Directory;
