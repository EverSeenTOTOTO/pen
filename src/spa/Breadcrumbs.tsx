/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';
import Breadcrumbs from '@material-ui/core/Breadcrumbs';
import Link from '@material-ui/core/Link';
import HomeIcon from '@material-ui/icons/Home';

import { PenDirInfo } from './common';

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

const getLinks = (current: PenDirInfo) => {
  const split = current.relative.split('/');
  const lks = [];

  for (let i = 0; i < split.length; ++i) {
    lks.push({
      filename: split[i],
      relative: split.slice(0, i + 1).join('/'),
      type: /(md|markdown)$/.test(split[i]) ? 'markdown' : 'dir',
      current: i === split.length - 1, // 最后一个是current本身
    });
  }

  return lks;
};

const BreadCrumbRoutes = ({ onClick, files, stack }: { onClick: any, files: PenDirInfo[]|undefined, stack: PenDirInfo[]}) => {
  const classes = useStyles();
  const [links, setLinks] = React.useState<PenDirInfo[]>([]);

  React.useEffect(() => {
    if (Array.isArray(files)) {
      const current = files.filter((each) => each.current)[0];
      if (current) { // is markdown
        setLinks(getLinks(current));
      } else { // is dir
        const dir = stack[stack.length - 1];
        if (dir) {
          setLinks(getLinks(dir));
        }
      }
    }
  }, [files]);

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
          onClick={() => onClick({
            relative: './', filename: '', type: 'dir', current: false,
          })}
        />
      </Link>
      {links.map((link) => {
        return (
          <Link component="button" color="inherit" onClick={() => onClick(link)}>
            {link.filename}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
};

export default BreadCrumbRoutes;
