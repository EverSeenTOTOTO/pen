import { observer } from 'mobx-react-lite';
import { useStore } from '@/store';
import Paper from '@mui/material/Paper';
import { makeStyles } from '@mui/styles';
import { Theme } from '@mui/material/styles';
import { createMarkup } from '@/utils';
import { Container } from '@mui/material';
import Typography from '@mui/material/Typography';
import Skeleton from '@mui/lab/Skeleton';
import { Suspense } from 'react';

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    height: '100%',
  },
  paper: {
    padding: theme.spacing(2),
    [theme.breakpoints.down('md')]: {
      padding: theme.spacing(1),
    },
  },
}));

const Loading = () => {
  const classes = useStyles();

  return <Paper
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
  </Paper>;
};

const Data = observer(() => {
  const classes = useStyles();
  const home = useStore('home');

  // eslint-disable-next-line @typescript-eslint/no-throw-literal
  if (home.loading) throw new Promise<void>((res) => res());

  return <Paper
    classes={{
      root: classes.paper,
    }}
    dangerouslySetInnerHTML={createMarkup(home.html)}
  />;
});

const Markdown = observer(() => {
  const classes = useStyles();

  return <Container
    maxWidth={false}
    // required for github-markdown-css
    className="markdown-body"
    classes={{
      root: classes.root,
    }}
  >
    <Suspense fallback={<Loading />}>
      <Data />
    </Suspense>
  </Container>;
});

export default Markdown;
