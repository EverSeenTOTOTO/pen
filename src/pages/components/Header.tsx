import Breadcrumbs from '@material-ui/core/Breadcrumbs';
import Link from '@material-ui/core/Link';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import HomeIcon from '@material-ui/icons/Home';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/store';
import { NoSsr, Switch } from '@material-ui/core';

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
  const drawer = useStore('drawer');

  return (
    <div className={classes.root}>
      <Breadcrumbs aria-label="breadcrumb" className={classes.breadcrumb}>
        <Link onClick={() => drawer.toggle()}>
          <NoSsr>
            <HomeIcon className={classes.icon} />
          </NoSsr>
        </Link>
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
