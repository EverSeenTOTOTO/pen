/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useEffect, useState } from 'react';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import Breadcrumbs from '@material-ui/core/Breadcrumbs';
import Link from '@material-ui/core/Link';
import HomeIcon from '@material-ui/icons/Home';
import { useHistory, useLocation } from 'react-router-dom';

const useStyles = makeStyles((theme: Theme) => createStyles({
  root: {
    paddingTop: theme.spacing(2),
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
}));

const BreadCrumbRoutes = () => {
  const classes = useStyles();
  const history = useHistory();
  const { pathname } = useLocation();
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

    if (pathname !== path) {
      history.push(path);
    }
  };

  return (
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
  );
};

export default BreadCrumbRoutes;
