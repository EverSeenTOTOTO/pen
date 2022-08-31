import { observer } from 'mobx-react-lite';
import { Theme } from '@mui/material/styles';
import { makeStyles, createStyles } from '@mui/styles';
import MuiDrawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import TreeView from '@mui/lab/TreeView';
import IconButton from '@mui/material/IconButton';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandLessTwoToneIcon from '@mui/icons-material/ExpandLessTwoTone';
import { useStore } from '@/store';
import { Folder, Description } from '@mui/icons-material';
import { NoSsr } from '@mui/material';
import { useNav } from '@/store/hooks';
import clsx from 'clsx';
import { useRef } from 'react';
import Toc from './Toc';

const useStyles = makeStyles((theme: Theme) => createStyles({
  drawer: {
    width: theme.spacing(40),
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },
  drawerOpen: {
    width: theme.spacing(40),
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  drawerClose: {
    width: theme.spacing(8),
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    [theme.breakpoints.down('md')]: {
      width: theme.spacing(4),
    },
  },
  drawerContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflowX: 'hidden',
  },
  dir: {
    flexGrow: 1,
  },
  hidden: {
    display: 'none',
  },
  toc: {
    flexGrow: 1,
    padding: theme.spacing(2),
    '& .MuiTypography-body1': {
      fontSize: '0.875rem',
    },
    '& .MuiTreeItem-label': {
      textOverflow: 'ellipsis',
      overflow: 'hidden',
    },
  },
  icon: {
    minWidth: theme.spacing(4),
    '& svg': {
      fontSize: '1rem',
    },
  },
  filename: {
    '& span': {
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
    },
  },
  box: {
    flexGrow: 1,
  },
  btn: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
    justifyContent: 'flex-end',
  },
  btnClose: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
}));

const Drawer = observer(() => {
  const classes = useStyles();
  const drawer = useStore('drawer');
  const nav = useNav();
  const ref = useRef<HTMLElement | null>();

  return (
    <MuiDrawer
      variant="permanent"
      className={clsx(classes.drawer, {
        [classes.drawerOpen]: drawer.visible,
        [classes.drawerClose]: !drawer.visible,
      })}
      classes={{
        paper: clsx({
          [classes.drawerOpen]: drawer.visible,
          [classes.drawerClose]: !drawer.visible,
        }),
      }}
    >
      <div className={classes.drawerContainer}>
        <List dense className={clsx(classes.dir, { [classes.hidden]: !drawer.visible })}>
          {drawer.childDocs.map((doc) => (
            <ListItem button key={doc.filename} onClick={() => nav(doc.relativePath)}>
              <NoSsr>
                <ListItemIcon className={classes.icon}>{
                  doc.type === 'directory'
                    ? <Folder />
                    : <Description />
                }</ListItemIcon>
              </NoSsr>
              <ListItemText className={classes.filename} primary={doc.filename} />
            </ListItem>
          ))}
        </List>
        <Divider />
        {drawer.toc.length > 0 && <TreeView
          ref={ref}
          className={clsx(classes.toc, {
            [classes.hidden]: !drawer.visible,
          })}
          expanded={drawer.expandedToc}
          onNodeToggle={(_, data) => drawer.setExpandedToc(data)}
          onNodeFocus={(e, id) => {
            const heading = document.getElementById(id);

            heading?.scrollIntoView();
            e.preventDefault();
          }}
          defaultCollapseIcon={<NoSsr><ExpandMoreIcon /></NoSsr>}
          defaultExpandIcon={<NoSsr><ChevronRightIcon /></NoSsr>}
        >
          <Toc toc={drawer.toc[0]} />
        </TreeView>}
        <div className={clsx({ [classes.box]: !drawer.visible })} />
        <Divider />
        <div className={clsx(classes.btn, { [classes.btnClose]: !drawer.visible })}>
          <IconButton onClick={() => drawer.toggle()} size="large">
            {drawer.visible ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
          <IconButton
            onClick={() => {
              ref.current?.scrollIntoView();
              window.scrollTo(0, 0);
            }}
            size="large">
            <ExpandLessTwoToneIcon />
          </IconButton>
        </div>
      </div>
    </MuiDrawer>
  );
});

export default Drawer;
