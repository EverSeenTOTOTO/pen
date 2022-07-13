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
    [theme.breakpoints.down('sm')]: {
      padding: 0,
      marginLeft: theme.spacing(4),
    },
  },
  contentShift: {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: theme.spacing(40),
    [theme.breakpoints.down('sm')]: {
      marginLeft: theme.spacing(4),
    },
  },
}));

const Home = observer(() => {
  const classes = useStyles();
  const drawer = useStore('drawer');
  const theme = useStore('theme');
  const ui = useStore('ui');

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
      open={ui.message !== ''}
      autoHideDuration={3000}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      onClose={(_?: React.SyntheticEvent, reason?: string) => {
        if (reason === 'clickaway') { return; }
        ui.notify('info', '');
      }}
    >
      <Alert severity={ui.severity}>
        {ui.message}
      </Alert>
    </Snackbar>
  </ThemeProvider>;
});

export default Home;
