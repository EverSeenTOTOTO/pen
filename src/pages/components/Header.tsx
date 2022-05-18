import Breadcrumbs from '@material-ui/core/Breadcrumbs';
import Link from '@material-ui/core/Link';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import HomeIcon from '@material-ui/icons/Home';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/store';
import { NoSsr, Switch } from '@material-ui/core';
import { useNav } from '@/store/hooks';

const useStyles = makeStyles((theme: Theme) => createStyles({
  root: {
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
    '& li:not(:nth-child(1))': {
      marginTop: -theme.spacing(1),
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
  const home = useStore('home');
  const socket = useStore('socket');

  return (
    <div className={classes.root}>
      <Breadcrumbs aria-label="breadcrumb" className={classes.breadcrumb}>
        <Link onClick={() => nav(socket.namespace)}>
          <NoSsr>
            <HomeIcon className={classes.icon} />
          </NoSsr>
        </Link>
        {home.breadcrumb.map((link) => (
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
