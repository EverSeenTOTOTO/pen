/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import React from 'react';
import Paper from '@material-ui/core/Paper';
import { makeStyles } from '@material-ui/core/styles';

import { createMarkup } from './common';

const useStyles = makeStyles((theme) => ({
  root: {
    paddingLeft: theme.spacing(4),
    paddingRight: theme.spacing(4),
    height: '100%',
    overflowY: 'scroll',
  },
}));

const Markdown = ({ html }: { html: string }) => {
  const classes = useStyles();

  return (
    <Paper
      classes={{
        root: classes.root,
      }}
      dangerouslySetInnerHTML={createMarkup(html)}
    />
  );
};

export default Markdown;
