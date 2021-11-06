/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import React from 'react';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Skeleton from '@material-ui/lab/Skeleton';
import { makeStyles } from '@material-ui/core/styles';

import { Container } from '@material-ui/core';
import { createMarkup } from './common';

const useStyles = makeStyles((theme) => ({
  root: {
    paddingLeft: theme.spacing(4),
    paddingRight: theme.spacing(4),
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
    height: '100%',
  },
  paper: {
    padding: theme.spacing(2),
  },
}));

const Markdown = ({ html }: { html: string }) => {
  const classes = useStyles();

  return (
    <Container
      maxWidth={false}
      className="markdown-body"
      classes={{
        root: classes.root,
      }}
    >
      {html.length > 0
        ? (
          <Paper
            classes={{
              root: classes.paper,
            }}
            dangerouslySetInnerHTML={createMarkup(html)}
          />
        )

        : (
          <Paper
            classes={{
              root: classes.paper,
            }}
          >
            <Typography component="div" variant="h1">
              <Skeleton animation="wave" />
            </Typography>
            <Typography component="div" variant="caption">
              <Skeleton animation="wave" />
            </Typography>
            <Typography component="div" variant="body1">
              <Skeleton animation="wave" />
            </Typography>
            <Typography component="div" variant="body1">
              <Skeleton animation="wave" />
            </Typography>
            <Typography component="div" variant="body1">
              <Skeleton animation="wave" />
            </Typography>
          </Paper>
        )}
    </Container>
  );
};

export default Markdown;
