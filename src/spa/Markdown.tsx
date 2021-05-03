/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import React from 'react';
import Paper from '@material-ui/core/Paper';
import { makeStyles } from '@material-ui/core/styles';

import { createMarkup } from './common';

const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(2),
    textAlign: 'center',
    height: '100vh',
  },
}));

const Markdown = ({ html }: { html: string }) => {
  const classes = useStyles();

  return (
    <Paper className={classes.paper} dangerouslySetInnerHTML={createMarkup(html)} />
  );
};

export default Markdown;
