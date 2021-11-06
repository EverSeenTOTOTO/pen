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
import { PenDirInfo } from './stores/blog';
import RootContext from './stores/index';

const useStyles = makeStyles({
  drawerPaper: {
    width: 320,
  },
});

const DrawerListItem = ({ files, localCurrent }) => {
  const history = useHistory();

  return files.map((each: PenDirInfo) => {
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
};

const Drawer = observer(() => {
  const classes = useStyles();
  const history = useHistory();
  const root = useContext(RootContext);
  const callback = useRef<(evt: KeyboardEvent) => void>();

  useEffect(() => autorun(() => {
    const cleanup = () => {
      if (callback.current) {
        document.removeEventListener('keyup', callback.current);
      }
    };

    cleanup();
    callback.current = (evt: KeyboardEvent) => {
      const { localCurrent } = root.blogStore;

      if (evt.code === 'Enter' && localCurrent >= 0) {
        history.push(`/${root.blogStore.files[localCurrent].relative}`);
      }
    };

    window.addEventListener('keyup', callback.current);
    return cleanup;
  }), []);
  useEffect(() => {
    const closure = (evt: KeyboardEvent) => {
      switch (evt.code) {
        case 'Tab': {
          if (evt.shiftKey) {
            root.blogStore.decreaseLocalCurrent();
          } else {
            root.blogStore.increaseLocalCurrent();
          }
          break;
        }
        default:
          break;
      }
    };

    document.addEventListener('keyup', closure);
    return () => document.removeEventListener('keyup', closure);
  }, []);

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
