import { observer } from 'mobx-react-lite';
import clsx from 'clsx';
import { useStore } from '@/store';
import Snackbar from '@material-ui/core/Snackbar';
import Alert from '@material-ui/lab/Alert';
import CssBaseline from '@material-ui/core/CssBaseline';
import { makeStyles, ThemeProvider } from '@material-ui/core/styles';
import { useAutoFetch, useClipboard, useMUIServerStyle } from '@/store/hooks';
import Markdown from './components/Markdown';
import Drawer from './components/Drawer';
import Header from './components/Header';

const useStyles = makeStyles((theme) => ({
  content: {
    padding: theme.spacing(2),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: theme.spacing(8),
    [theme.breakpoints.down('md')]: {
      padding: 0,
      marginLeft: theme.spacing(4),
    },
  },
  contentShift: {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: theme.spacing(36),
    [theme.breakpoints.down('md')]: {
      marginLeft: theme.spacing(4),
    },
  },
}));

const Home = observer(() => {
  const classes = useStyles();
  const home = useStore('home');
  const drawer = useStore('drawer');
  const theme = useStore('theme');

  useAutoFetch();
  useClipboard();
  useMUIServerStyle();

  return <ThemeProvider theme={theme.theme}>
    <CssBaseline />
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
  </ThemeProvider>;
});

export default Home;
