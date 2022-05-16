import Breadcrumbs from '@material-ui/core/Breadcrumbs';
import Link from '@material-ui/core/Link';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import HomeIcon from '@material-ui/icons/Home';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/store';
import { NoSsr, Switch } from '@material-ui/core';
import { useNavigate } from 'react-router';
import { isMarkdown } from '@/utils';

const useStyles = makeStyles((theme: Theme) => createStyles({
  root: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: theme.spacing(1),
    marginLeft: theme.spacing(3),
    marginRight: theme.spacing(3),
  },
  breadcrumb: {
    marginTop: theme.spacing(1),
    marginLeft: theme.spacing(1),
    '& li:not(:nth-child(1))': {
      marginTop: -theme.spacing(0.5),
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
  const theme = useStore('theme');
  const home = useStore('home');
  const drawer = useStore('drawer');
  const navigate = useNavigate();
  const nav = (relative: string) => {
    navigate(relative);
    if (!isMarkdown(relative)) {
      drawer.toggle(true);
    }
  };

  return (
    <div className={classes.root}>
      <Breadcrumbs aria-label="breadcrumb" className={classes.breadcrumb}>
        <Link onClick={() => nav('/')}>
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
