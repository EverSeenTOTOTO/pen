import { makeStyles } from '@material-ui/core/styles';
import Alert from '@material-ui/lab/Alert';
import Snackbar from '@material-ui/core/Snackbar';
import { observer } from 'mobx-react-lite';
import React, { useContext, useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { autorun } from 'mobx';
import BottomNavigation from './BottomNavigation';
import BreadCrumbRoutes from './Breadcrumbs';
import { getUpdir } from './common';
import Drawer from './Drawer';
import Markdown from './Markdown';
import RootContext from './stores/index';

const useStyles = makeStyles(() => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
  },
  markdown: {
    flexGrow: 1,
  },
}));

const Blog = observer(() => {
  const classes = useStyles();
  const history = useHistory();
  const { pathname } = useLocation();
  const root = useContext(RootContext);
  const [open, setOpen] = useState(false);
  const closeSnackBar = (_event?: React.SyntheticEvent, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpen(false);
  };

  useEffect(() => autorun(() => {
    setOpen(root.uiStore.errorMessage !== '');
  }), []);
  useEffect(() => {
    window.scrollTo(0, 0);
    root.blogStore.reset();
    root.socketStore.fetchData(pathname);

    const closure = (evt: KeyboardEvent) => {
      switch (evt.code) {
        case 'Enter':
          root.uiStore.toggleDrawer();
          break;
        case 'Backspace':
          history.push(getUpdir(pathname));
          break;
        default:
          break;
      }
    };

    document.addEventListener('keyup', closure);
    return () => document.removeEventListener('keyup', closure);
  }, [pathname]);

  return (
    <main className={classes.root}>
      <Drawer />
      <div className={classes.markdown}>
        <BreadCrumbRoutes pathname={pathname} />
        <Markdown html={root.blogStore.content} loading={root.socketStore.loading} />
      </div>
      <BottomNavigation />
      <Snackbar
        open={open}
        autoHideDuration={3000}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        onClose={closeSnackBar}
      >
        <Alert severity="error">
          {root.uiStore.errorMessage}
        </Alert>
      </Snackbar>
    </main>
  );
});

export default Blog;
