import { observer } from 'mobx-react-lite';
import { makeStyles, createStyles } from '@material-ui/core/styles';
import MuiDrawer from '@material-ui/core/Drawer';
import List from '@material-ui/core/List';
import Divider from '@material-ui/core/Divider';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
// import TreeView from '@material-ui/lab/TreeView';
import IconButton from '@material-ui/core/IconButton';
// import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import ExpandLessTwoToneIcon from '@material-ui/icons/ExpandLessTwoTone';
import { useStore } from '@/store';
import { Folder, Description } from '@material-ui/icons';
import { NoSsr } from '@material-ui/core';
import { useNav } from '@/store/hooks';
import clsx from 'clsx';

const useStyles = makeStyles((theme) => createStyles({
  drawer: {
    width: theme.spacing(30),
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },
  drawerOpen: {
    width: theme.spacing(30),
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  drawerClose: {
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: 'hidden',
    width: theme.spacing(8),
  },
  drawerContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'auto',
  },
  toc: {
    padding: theme.spacing(2),
    '& .MuiTypography-body1': {
      fontSize: '0.875rem',
    },
  },
  dir: {
    flexGrow: 1,
    marginTop: theme.spacing(1),
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
          {/* <TreeView
            className={classes.toc}
            defaultExpanded={drawer.expandedToc}
            defaultCollapseIcon={<NoSsr><ExpandMoreIcon /></NoSsr>}
            defaultExpandIcon={<NoSsr><ChevronRightIcon /></NoSsr>}
          >
            <Toc toc={drawer.toc} />
          </TreeView> */}
          <Divider />
          <List dense className={classes.dir}>
            {drawer.visible && drawer.childDocs.map((doc) => (
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
          <div className={clsx(classes.btn, { [classes.btnClose]: !drawer.visible })}>
            <IconButton onClick={() => drawer.toggle()}>
              {drawer.visible ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </IconButton>
            <IconButton onClick={() => window.scrollTo(0, 0)}>
              <ExpandLessTwoToneIcon />
            </IconButton>
          </div>
        </div>
      </MuiDrawer>);
});

export default Drawer;
