import { observer } from 'mobx-react-lite';
import { useStore } from '@/store';
import Paper from '@material-ui/core/Paper';
import { makeStyles } from '@material-ui/core/styles';
import { createMarkup } from '@/utils';
import { Container } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  root: {
    height: '100%',
  },
  paper: {
    padding: theme.spacing(2),
  },
}));

const Markdown = observer(() => {
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

export default Markdown;
