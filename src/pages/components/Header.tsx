import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import { styled } from '@mui/material/styles';
import HomeIcon from '@mui/icons-material/Home';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/store';
import { NoSsr, Switch } from '@mui/material';
import { useNav } from '@/store/hooks';

const Root = styled('div')(({ theme }) => ({
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
}));

const StyledBreadcrumbs = styled(Breadcrumbs)(({ theme }) => ({
  marginTop: theme.spacing(1),
  marginLeft: theme.spacing(1),
  '& li:nth-of-type(1)': {
    marginTop: `-${theme.spacing(0.25)}`,
    marginRight: `-${theme.spacing(0.5)}`,
  },
  '& li:not(:nth-of-type(1))': {
    marginTop: `-${theme.spacing(1)}`,
  },
}));

const StyledHomeIcon = styled(HomeIcon)(({ theme }) => ({
  marginRight: theme.spacing(0.5),
  width: 20,
  height: 20,
  cursor: 'pointer',
}));

const BreadCrumbRoutes = observer(() => {
  const nav = useNav();
  const theme = useStore('theme');
  const ui = useStore('ui');
  const socket = useStore('socket');

  return (
    <Root>
      <StyledBreadcrumbs aria-label="breadcrumb">
        <Link onClick={() => nav(socket.namespace)}>
          <NoSsr>
            <StyledHomeIcon />
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
      </StyledBreadcrumbs>
      <Switch
        checked={theme.mode === 'dark'}
        onChange={() => theme.changeTheme(theme.mode === 'dark' ? 'light' : 'dark')}
        name="checkedB"
        color="primary"
      />
    </Root>
  );
});

export default BreadCrumbRoutes;
