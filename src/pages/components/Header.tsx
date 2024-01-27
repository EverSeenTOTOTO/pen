import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import { styled } from '@mui/material/styles';
import HomeIcon from '@mui/icons-material/Home';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/store';
import NoSsr from '@mui/material/NoSsr';
import Switch from '@mui/material/Switch';
import { useNav } from '@/store/hooks';

const Root = styled('div')(({ theme }) => ({
  position: 'sticky',
  top: 0,
  zIndex: 1,
  backgroundColor: theme.palette.background.default,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(1),
  marginLeft: theme.spacing(3),
  marginRight: theme.spacing(3),
  [theme.breakpoints.down('md')]: {
    marginBottom: 0,
    marginLeft: theme.spacing(1),
    marginRight: 0,
  },
}));

const StyledBreadcrumbs = styled(Breadcrumbs)(({ theme }) => ({
  marginTop: theme.spacing(1),
  marginLeft: theme.spacing(1),
  '& li:nth-of-type(1)': {
    marginTop: `${theme.spacing(0.5)}`,
    marginRight: `-${theme.spacing(1)}`,
  },
  [theme.breakpoints.down('md')]: {
    '& a': {
      fontSize: '0.8rem',
    },
    '& li:not(.MuiBreadcrumbs-li)': {
      marginTop: `-${theme.spacing(0.5)}`,
    },
    '& li.MuiBreadcrumbs-li:not(:first-of-type)': {
      marginTop: `-${theme.spacing(1)}`,
    },
    '& .MuiBreadcrumbs-separator': {
      marginLeft: theme.spacing(0.5),
      marginRight: theme.spacing(0.5),
    },
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
        <Link component="a" href={socket.namespace} onClick={(e) => {
          e.preventDefault();
          nav(socket.namespace);
        }}>
          <NoSsr>
            <StyledHomeIcon />
          </NoSsr>
        </Link>
        {ui.breadcrumb.map((link) => (
          <Link
            key={link.relative}
            component="a"
            href={link.relative}
            color="inherit"
            onClick={(e) => {
              e.preventDefault();
              nav(link.relative);
            }}
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
