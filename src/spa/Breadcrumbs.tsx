/* eslint-disable jsx-a11y/anchor-is-valid */
import Breadcrumbs from '@material-ui/core/Breadcrumbs';
import Link from '@material-ui/core/Link';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import HomeIcon from '@material-ui/icons/Home';
import React, { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

import { Switch } from '@material-ui/core';
import RootContext from './stores/index';

const useStyles = makeStyles((theme: Theme) => createStyles({
  root: {
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(1),
    paddingLeft: theme.spacing(4),
  },
  link: {
    display: 'flex',
  },
  icon: {
    marginRight: theme.spacing(0.5),
    width: 20,
    height: 20,
    cursor: 'pointer',
  },
  switch: {
    position: 'absolute',
    top: theme.spacing(1),
    right: theme.spacing(2),
  },
}));

const BreadCrumbRoutes = observer(({ pathname }: { pathname: string }) => {
  const classes = useStyles();
  const history = useHistory();
  const root = useContext(RootContext);
  const [stack, setStack] = useState<{ relative: string, name: string }[]>([]);

  useEffect(() => {
    const split = pathname.split('/').slice(1);
    const result = [];

    for (let i = 0; i < split.length; ++i) {
      result.push({
        relative: split.slice(0, i + 1).join('/'),
        name: split[i],
      });
    }
    setStack(result);
  }, [pathname]);

  const push = (path: string) => {
    document.activeElement?.blur?.();

    if (path !== pathname) {
      history.push(path);
    } else {
      root.uiStore.toggleDrawer();
    }
  };

  return (
    <>
      <Breadcrumbs
        aria-label="breadcrumb"
        className={classes.root}
      >
        <Link
          color="inherit"
          className={classes.link}
        >
          <HomeIcon
            className={classes.icon}
            onClick={() => push('/')}
          />
        </Link>
        {stack.map((link) => {
          return (
            <Link
              component="button"
              color="inherit"
              onClick={() => push(`/${link.relative}`)}
            >
              {link.name}
            </Link>
          );
        })}
      </Breadcrumbs>
      <Switch
        className={classes.switch}
        checked={root.uiStore.darkMode}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => root.uiStore.toggleDarkMode(event.target.checked)}
        name="checkedB"
        color="primary"
      />
    </>
  );
});

export default BreadCrumbRoutes;
