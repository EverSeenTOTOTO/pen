import {
  List,
  ListItem,
  ListItemIcon,
  ListItemAvatar,
  ListItemText,
  ListSubheader,
  Avatar,
  Collapse,
} from '@material-ui/core';
import React from 'react';
import { Folder, TextFields } from '@material-ui/icons';

export type PenData = Map<string, string|PenData>;
export const isMarkdown = (value: string|PenData): value is string => {
  return typeof value === 'string';
};

const Directory = ({ root, dirs }: { root: string, dirs: PenData }) => {
  const items = [...dirs.keys()].map((key: string) => {
    const value = dirs.get(key);

    if (isMarkdown(value)) {
      return (
        <ListItem>
          <ListItemIcon>
            <TextFields />
          </ListItemIcon>
          <ListItemText primary={key} />
        </ListItem>
      );
    }

    return (
      <>
        <ListItem>
          <ListItemAvatar>
            <Avatar>
              <Folder />
            </Avatar>
          </ListItemAvatar>
          <ListItemText primary={key} />
        </ListItem>
        <Collapse in={false} timeout="auto" unmountOnExit>
          <List component="div" disablePadding />
        </Collapse>
      </>
    );
  });

  return (
    <List
      component="nav"
      aria-labelledby="nested-list-subheader"
      subheader={(
        <ListSubheader component="div" id="nested-list-subheader">
          {root}
        </ListSubheader>
  )}
    >
      {items}
    </List>
  );
};

export default Directory;
