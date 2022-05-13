import { observer } from 'mobx-react-lite';
import { useStore } from '@/store';
import Paper from '@material-ui/core/Paper';
import { makeStyles } from '@material-ui/core/styles';
import { createMarkup } from '@/utils';
import { Container } from '@material-ui/core';

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

const Home = observer(() => {
  const classes = useStyles();
  const home = useStore('home');

  return <Container
      maxWidth={false}
      className="markdown-body"
      classes={{
        root: classes.root,
      }}
    >
    <Paper
      classes={{
        root: classes.paper,
      }}
      dangerouslySetInnerHTML={createMarkup(home.html)}
    />
  </Container>;
});

export default Home;
