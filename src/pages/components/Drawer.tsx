/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { observer } from 'mobx-react-lite';
import { styled } from '@mui/material/styles';
import MuiDrawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import TreeView from '@mui/lab/TreeView';
import IconButton from '@mui/material/IconButton';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandLessTwoToneIcon from '@mui/icons-material/ExpandLessTwoTone';
import NoSsr from '@mui/material/NoSsr';
import { useStore } from '@/store';
import Folder from '@mui/icons-material/Folder';
import Description from '@mui/icons-material/Description';
import { useNav } from '@/store/hooks';
import clsx from 'clsx';
import { useRef } from 'react';
import Toc from './Toc';

export const DRAWER_WIDTH = 30;
export const DRAWER_WIDTH_MOBILE = 24;
export const DRAWER_WIDTH_CLOSED = 8;
export const DRAWER_WIDTH_CLOSED_MOBILE = 4;

const StyledDrawer = styled(MuiDrawer)(({ theme }) => ({
  width: theme.spacing(DRAWER_WIDTH),
  flexShrink: 0,
  whiteSpace: 'nowrap',
  '& .drawer-drawerOpen': {
    width: theme.spacing(DRAWER_WIDTH),
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    [theme.breakpoints.down('md')]: {
      width: theme.spacing(DRAWER_WIDTH_MOBILE),
    },
  },
  '& .drawer-drawerClose': {
    width: theme.spacing(DRAWER_WIDTH_CLOSED),
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    [theme.breakpoints.down('md')]: {
      width: theme.spacing(DRAWER_WIDTH_CLOSED_MOBILE),
    },
  },
  '& .drawer-childHidden': {
    display: 'none',
  },
  '& .drawer-btnClose': {
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  '& .drawerItem-loading': {
    color: theme.palette.mode === 'dark' ? 'grey' : '#b2b2b2',
  },
}));

const StyledDrawerContainer = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  overflowX: 'hidden',
}));

const StyledToc = styled(TreeView)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(2),
  '& .MuiTypography-body1': {
    fontSize: '0.875rem',
  },
  '& .MuiTreeItem-label': {
    textOverflow: 'ellipsis',
    overflow: 'hidden',
  },
}));

const StyledBtn = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

const StyledFolderItem = styled(ListItemText)(() => ({
  '& span': {
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  '& a': {
    textDecoration: 'none',
    color: 'inherit',
  },
}));

const Folders = observer(() => {
  const home = useStore('home');
  const drawer = useStore('drawer');
  const nav = useNav();

  return <List dense sx={{ flexGrow: 1 }} className={clsx({ 'drawer-childHidden': !drawer.visible })}>
    {drawer.subdirs.map((doc) => (
      <ListItemButton
        key={doc.filename}
        disableRipple={home.last !== doc.relativePath && home.loading}
        className={clsx({ 'drawerItem-loading': home.loading && home.last !== doc.relativePath })}
        onClick={() => {
          if (!home.loading) {
            nav(doc.relativePath);
          }
        }}
      >
        <NoSsr>
          <ListItemIcon sx={{
            minWidth: (theme) => theme.spacing(4),
            '& svg': {
              fontSize: '1rem',
            },
          }}>{
              doc.type === 'directory'
                ? <Folder />
                : <Description />
            }</ListItemIcon>
        </NoSsr>
        <StyledFolderItem primary={<a href={doc.relativePath} onClick={(e) => { e.preventDefault(); }}>{doc.filename}</a>} />
      </ListItemButton>
    ))}
  </List>;
});

const Drawer = observer(() => {
  const drawer = useStore('drawer');
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const tocRef = useRef<HTMLElement | null>();

  return (
    <StyledDrawer
      variant="permanent"
      classes={{
        paper: clsx({
          'drawer-drawerOpen': drawer.visible,
          'drawer-drawerClose': !drawer.visible,
        }),
      }}
      onScroll={(e) => console.log(e.target)}
    >
      <StyledDrawerContainer ref={drawerRef}
      >
        <Folders />
        <Divider />
        {drawer.toc.length > 0 && <StyledToc
          ref={tocRef}
          className={clsx({
            'drawer-childHidden': !drawer.visible,
          })}
          expanded={drawer.expandedToc}
          onNodeToggle={(_, data) => drawer.setExpandedToc(data)}
          onNodeFocus={(e, id) => {
            window.location.hash = `#${id}`;
            e.preventDefault();
          }}
          defaultCollapseIcon={<NoSsr><ExpandMoreIcon /></NoSsr>}
          defaultExpandIcon={<NoSsr><ChevronRightIcon /></NoSsr>}
        >
          <Toc toc={drawer.toc[0]} />
        </StyledToc>}
        <div style={{ flexGrow: 1 }} className={clsx({ 'drawer-childHidden': drawer.visible })} />
        <Divider />
        <StyledBtn className={clsx({ 'drawer-btnClose': !drawer.visible })}>
          <IconButton onClick={() => drawer.toggle()} size="large">
            {drawer.visible ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
          <IconButton
            onClick={() => {
              tocRef.current?.scrollIntoView();
              window.scrollTo(0, 0);
            }}
            size="large">
            <ExpandLessTwoToneIcon />
          </IconButton>
        </StyledBtn>
      </StyledDrawerContainer>
    </StyledDrawer>
  );
});

export default Drawer;
