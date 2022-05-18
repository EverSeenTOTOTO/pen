import { observer } from 'mobx-react-lite';
import { useStore } from '@/store';
import Paper from '@material-ui/core/Paper';
import { makeStyles } from '@material-ui/core/styles';
import { createMarkup } from '@/utils';
import { Container } from '@material-ui/core';
import Typography from '@material-ui/core/Typography';
import Skeleton from '@material-ui/lab/Skeleton';

const useStyles = makeStyles((theme) => ({
  root: {
    height: '100%',
  },
  paper: {
    padding: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(1),
    },
  },
}));

const Markdown = observer(() => {
  const classes = useStyles();
  const home = useStore('home');

  return <Container
      maxWidth={false}
      // required for github-markdown-css
      className="markdown-body"
      classes={{
        root: classes.root,
      }}
    >
    {!home.loading
      ? <Paper
          classes={{
            root: classes.paper,
          }}
          dangerouslySetInnerHTML={createMarkup(home.html)}
        />
      : <Paper
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
      </Paper>}
  </Container>;
});

export default Markdown;
