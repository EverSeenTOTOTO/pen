import React from 'react';
import SwipeableDrawer from '@material-ui/core/SwipeableDrawer';
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Folder, TextFields } from '@material-ui/icons';
import { useHistory } from 'react-router';

import { PenDirInfo } from './common';

const useStyles = makeStyles({
  drawerPaper: {
    width: 320,
  },
});

type DrawerProps = {
  open: boolean,
  toggleDrawer: (value?: boolean)=> (e: React.KeyboardEvent | React.MouseEvent) => void,
  files: PenDirInfo[],
  current: string
};

const Drawer = ({
  open, toggleDrawer, files, current,
}: DrawerProps) => {
  const classes = useStyles();
  const history = useHistory();
  const [localCurrent, setLocalCurrent] = React.useState(-1);

  React.useEffect(() => {
    const idx = files.findIndex((each) => each.filename === current);

    setLocalCurrent(idx >= files.length ? 0 : idx);
  }, [files, current]);
  React.useEffect(() => {
    const closure = (evt: KeyboardEvent) => {
      switch (evt.code) {
        case 'Enter':
          if (localCurrent >= 0) {
            history.push(`/${files[localCurrent].relative}`);
          }
          break;
        default:
          break;
      }
    };

    document.addEventListener('keyup', closure);

    return () => document.removeEventListener('keyup', closure);
  }, [localCurrent, history, files]);
  React.useEffect(() => {
    const closure = (evt: KeyboardEvent) => {
      switch (evt.code) {
        case 'Tab': {
          if (evt.shiftKey) {
            setLocalCurrent((c) => {
              const idx = c - 1;
              const next = Number.isNaN(idx)
                ? 0
                : idx < 0
                  ? files.length - 1
                  : idx;

              return next;
            });
            break;
          } else {
            setLocalCurrent((c) => {
              const idx = c + 1;
              const next = Number.isNaN(idx)
                ? 0
                : idx >= files.length
                  ? 0
                  : idx;

              return next;
            });
          }
          break;
        }
        default:
          break;
      }
    };

    document.addEventListener('keyup', closure);

    return () => document.removeEventListener('keyup', closure);
  }, [files, current]);

  const items = files.map((each: PenDirInfo) => {
    const currentItemClassName = files.indexOf(each) === localCurrent ? 'list-item--current' : '';

    return (
      <ListItem
        className={`list-item ripple ${currentItemClassName}`}
        onClick={() => {
          history.push(`/${each.relative}`);
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
    <SwipeableDrawer
      anchor="left"
      open={open}
      onClose={toggleDrawer(false)}
      onOpen={toggleDrawer(true)}
      classes={{
        paper: classes.drawerPaper,
      }}
    >
      <List
        component="nav"
        aria-labelledby="nested-list-subheader"
      >
        {items}
      </List>
    </SwipeableDrawer>
  );
};

export default Drawer;
