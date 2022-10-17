import { observer } from 'mobx-react-lite';
import clsx from 'clsx';
import { useStore } from '@/store';
import CssBaseline from '@mui/material/CssBaseline';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/lab/Alert';
import { ThemeProvider, styled } from '@mui/material/styles';
import { useAutoFetch, useClipboard, useCookie } from '@/store/hooks';
import Markdown from './components/Markdown';
import Drawer from './components/Drawer';
import Header from './components/Header';

const StyledMain = styled('main')(({ theme }) => ({
  '& .main-content': {
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
  '& .main-contentShift': {
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
  const drawer = useStore('drawer');
  const ui = useStore('ui');

  useCookie();
  useAutoFetch();
  useClipboard();

  return <StyledMain>
    <Drawer />
    <div className={clsx('main-content', {
      'main-contentShift': drawer.visible,
    })}>
      <Header />
      <Markdown />
    </div>
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
  </StyledMain>;
});

// migrate MUI@v4 to v5
const MigratedHome = observer(() => {
  const theme = useStore('theme');

  return (
    <ThemeProvider theme={theme.theme}>
      <CssBaseline />
      <Home />
    </ThemeProvider>
  );
});

export default MigratedHome;
