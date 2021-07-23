/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import Breadcrumbs from '@material-ui/core/Breadcrumbs';
import Link from '@material-ui/core/Link';
import HomeIcon from '@material-ui/icons/Home';
import { useHistory } from 'react-router-dom';

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

const BreadCrumbRoutes = ({ stack }: {stack: { relative: string, name: string }[]}) => {
  const classes = useStyles();
  const history = useHistory();

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
          onClick={() => history.push('/')}
        />
      </Link>
      {stack.map((link) => {
        return (
          <Link
            component="button"
            color="inherit"
            onClick={() => {
              console.log(link);
              history.push(link.relative);
            }}
          >
            {link.name}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
};

export default BreadCrumbRoutes;
