import {
  Avatar, List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import SwipeableDrawer from '@material-ui/core/SwipeableDrawer';
import { Folder, TextFields } from '@material-ui/icons';
import { autorun } from 'mobx';
import { observer } from 'mobx-react-lite';
import React, { useContext, useEffect, useRef } from 'react';
import { useHistory } from 'react-router';
import type { FileInfo } from '../watcher';
import RootContext from './stores/index';

const useStyles = makeStyles({
  drawerPaper: {
    width: 320,
  },
});

const DrawerListItem = ({ files, localCurrent }) => {
  const history = useHistory();

  return files.map((each: FileInfo) => {
    const currentItemClassName = files.indexOf(each) === localCurrent ? 'list-item--current' : '';

    return (
      <ListItem
        className={`list-item ripple ${currentItemClassName}`}
        onClick={() => {
          const href = `/${each.relative}`;
          if (each.type === 'pdf') {
            // use browser native, not pdfjs
            location.href = href;
          } else {
            history.push(href);
          }
        }}
      >
        <ListItemAvatar>
          <Avatar>
            { each.type !== 'dir' ? <TextFields /> : <Folder />}
          </Avatar>
        </ListItemAvatar>
        <ListItemText primary={each.filename} />
      </ListItem>
    );
  });
};

const Drawer = observer(() => {
  const classes = useStyles();
  const history = useHistory();
  const root = useContext(RootContext);
  const callback = useRef<(evt: KeyboardEvent) => void>();

  useEffect(() => autorun(() => {
    if (callback.current) {
      document.removeEventListener('keyup', callback.current);
    }

    callback.current = (evt: KeyboardEvent) => {
      if (evt.code === 'Enter' && root.blogStore.localCurrent >= 0) {
        history.push(`/${root.blogStore.files[root.blogStore.localCurrent].relative}`);
        return;
      }

      if (evt.code === 'Tab') {
        if (evt.shiftKey) {
          root.blogStore.decreaseLocalCurrent();
        } else {
          root.blogStore.increaseLocalCurrent();
        }
      }
    };

    window.addEventListener('keyup', callback.current);
  }), []);

  return (
    <SwipeableDrawer
      anchor="left"
      open={root.uiStore.drawerOpened}
      onClose={() => root.uiStore.toggleDrawer(false)}
      onOpen={() => root.uiStore.toggleDrawer(true)}
      classes={{
        paper: classes.drawerPaper,
      }}
    >
      <List
        component="nav"
        aria-labelledby="nested-list-subheader"
      >
        <DrawerListItem
          files={root.blogStore.files}
          localCurrent={root.blogStore.localCurrent}
        />
      </List>
    </SwipeableDrawer>
  );
});

export default Drawer;
