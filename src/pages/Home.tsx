import { observer } from 'mobx-react-lite';
import clsx from 'clsx';
import { useStore } from '@/store';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/lab/Alert';
import CssBaseline from '@mui/material/CssBaseline';
import {
  ThemeProvider, Theme, StyledEngineProvider,
} from '@mui/material/styles';
import { makeStyles } from '@mui/styles';
import { useAutoFetch, useClipboard, useMUIServerStyle } from '@/store/hooks';
import Markdown from './components/Markdown';
import Drawer from './components/Drawer';
import Header from './components/Header';

const useStyles = makeStyles((theme: Theme) => ({
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
    marginLeft: theme.spacing(40),
    [theme.breakpoints.down('md')]: {
      marginLeft: theme.spacing(4),
    },
  },
}));

const Home = observer(() => {
  const classes = useStyles();
  const drawer = useStore('drawer');
  const ui = useStore('ui');

  useAutoFetch();
  useClipboard();
  useMUIServerStyle();

  return <>
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
      onClose={(_, reason) => {
        if (reason === 'clickaway') { return; }
        ui.notify('info', '');
      }}
    >
      <Alert severity={ui.severity}>
        {ui.message}
      </Alert>
    </Snackbar>
  </>;
});

// migrate MUI@v4 to v5
const MigratedHome = observer(() => {
  const theme = useStore('theme');

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme.theme}>
        <Home />
      </ThemeProvider>
    </StyledEngineProvider>
  );
});

export default MigratedHome;
