import { observer } from 'mobx-react-lite';
import {
  alpha, makeStyles, withStyles, Theme, createStyles,
} from '@material-ui/core/styles';
import MuiDrawer from '@material-ui/core/Drawer';
import List from '@material-ui/core/List';
import Divider from '@material-ui/core/Divider';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import TreeView from '@material-ui/lab/TreeView';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import TreeItem, { TreeItemProps } from '@material-ui/lab/TreeItem';
import { useStore } from '@/store';
import { Folder, Description } from '@material-ui/icons';
import { NoSsr } from '@material-ui/core';
import { DocToc } from '@/types';

export const drawerWidth = 280;

const useStyles = makeStyles((theme) => createStyles({
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    width: drawerWidth,
  },
  drawerContainer: {
    overflow: 'auto',
  },
  toc: {
    flexGrow: 1,
    padding: theme.spacing(2),
    '& .MuiTypography-body1': {
      fontSize: '0.875rem',
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
}));

const StyledTreeItem = withStyles((theme: Theme) => createStyles({
  group: {
    marginLeft: 7,
    paddingLeft: 18,
    borderLeft: `1px dashed ${alpha(theme.palette.text.primary, 0.4)}`,
  },
}))((props: TreeItemProps) => <TreeItem {...props} />);

const Toc = ({ toc }: { toc: DocToc }) => (toc.children.length > 0
  ? <StyledTreeItem nodeId={toc.name} label={toc.name}>
    {
      toc.children.map((child) => <Toc key={child.name} toc={child} />)
    }
  </StyledTreeItem>
  : <StyledTreeItem nodeId={toc.name} label={toc.name} />
);

const Drawer = observer(() => {
  const classes = useStyles();
  const drawer = useStore('drawer');

  return (
      <MuiDrawer
        className={classes.drawer}
        variant="persistent"
        open={drawer.visible}
        classes={{
          paper: classes.drawerPaper,
        }}
      >
        <div className={classes.drawerContainer}>
        <TreeView
          className={classes.toc}
          defaultCollapseIcon={<ExpandMoreIcon />}
          defaultExpandIcon={<ChevronRightIcon />}
        >
          <Toc toc={drawer.toc} />
        </TreeView>
          <Divider />
          <List dense>
            {drawer.childDocs.map((doc) => (
              <ListItem button key={doc.filename}>
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
        </div>
      </MuiDrawer>);
});

export default Drawer;
