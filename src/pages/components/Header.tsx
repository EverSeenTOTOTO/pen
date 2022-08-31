import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import { Theme } from '@mui/material/styles';
import { createStyles, makeStyles } from '@mui/styles';
import HomeIcon from '@mui/icons-material/Home';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/store';
import { NoSsr, Switch } from '@mui/material';
import { useNav } from '@/store/hooks';

const useStyles = makeStyles((theme: Theme) => createStyles({
  root: {
    position: 'sticky',
    top: 0,
    zIndex: 999,
    backgroundColor: theme.palette.background.default,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
    marginLeft: theme.spacing(3),
    marginRight: theme.spacing(3),
  },
  breadcrumb: {
    marginTop: theme.spacing(1),
    marginLeft: theme.spacing(1),
    '& li:nth-child(1)': {
      marginTop: `-${theme.spacing(0.25)}`,
      marginRight: `-${theme.spacing(0.5)}`,
    },
    '& li:not(:nth-child(1))': {
      marginTop: `-${theme.spacing(1)}`,
    },
  },
  icon: {
    marginRight: theme.spacing(0.5),
    width: 20,
    height: 20,
    cursor: 'pointer',
  },
}));

const BreadCrumbRoutes = observer(() => {
  const classes = useStyles();
  const nav = useNav();
  const theme = useStore('theme');
  const ui = useStore('ui');
  const socket = useStore('socket');

  return (
    <div className={classes.root}>
      <Breadcrumbs aria-label="breadcrumb" className={classes.breadcrumb}>
        <Link onClick={() => nav(socket.namespace)}>
          <NoSsr>
            <HomeIcon className={classes.icon} />
          </NoSsr>
        </Link>
        {ui.breadcrumb.map((link) => (
          <Link
            key={link.relative}
            component="button"
            color="inherit"
            onClick={() => nav(link.relative)}
          >
            {link.filename}
          </Link>
        ))}
      </Breadcrumbs>
      <Switch
        checked={theme.dark}
        onChange={() => theme.changeTheme(theme.dark ? 'light' : 'dark')}
        name="checkedB"
        color="primary"
      />
    </div>
  );
});

export default BreadCrumbRoutes;
