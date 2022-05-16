import { observer } from 'mobx-react-lite';
import clsx from 'clsx';
import { useStore } from '@/store';
import Snackbar from '@material-ui/core/Snackbar';
import Alert from '@material-ui/lab/Alert';
import CssBaseline from '@material-ui/core/CssBaseline';
import { makeStyles, ThemeProvider } from '@material-ui/core/styles';
import { useAutoFetch, useTheme } from '@/store/hooks';
import Markdown from './components/Markdown';
import Drawer from './components/Drawer';
import Header from './components/Header';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },
  content: {
    flexGrow: 1,
    overflow: 'hidden',
    padding: theme.spacing(2),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  contentShift: {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  },
}));

const Home = observer(() => {
  const classes = useStyles();
  const home = useStore('home');
  const drawer = useStore('drawer');
  const theme = useStore('theme');

  useTheme();
  useAutoFetch();

  return <ThemeProvider theme={theme.theme}>
    <CssBaseline />
    <div className={classes.root}>
      <Drawer />
      <main className={clsx(classes.content, {
        [classes.contentShift]: drawer.visible,
      })}>
        <Header />
        <Markdown />
      </main>
      <Snackbar
        open={home.message !== ''}
        autoHideDuration={3000}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        onClose={() => home.notify('info', '')}
      >
        <Alert severity={home.severity}>
          {home.message}
        </Alert>
      </Snackbar>
    </div>
  </ThemeProvider>;
});

export default Home;
