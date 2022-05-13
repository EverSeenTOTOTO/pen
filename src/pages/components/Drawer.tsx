import { observer } from 'mobx-react-lite';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import MuiDrawer from '@material-ui/core/Drawer';
import List from '@material-ui/core/List';
import Divider from '@material-ui/core/Divider';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import { useStore } from '@/store';
import { Folder, Description } from '@material-ui/icons';
import { NoSsr } from '@material-ui/core';

export const drawerWidth = 240;

const useStyles = makeStyles(() => createStyles({
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
  filename: {
    '& span': {
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
    },
  },
}));

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
          {/* TODO: toc */}
          <Divider />
          <List>
            {drawer.childDocs.map((doc) => (
              <ListItem button key={doc.filename}>
                <NoSsr>
                  <ListItemIcon>{doc.type === 'directory' ? <Folder /> : <Description />}</ListItemIcon>
                </NoSsr>
                <ListItemText className={classes.filename} primary={doc.filename} />
              </ListItem>
            ))}
          </List>
        </div>
      </MuiDrawer>);
});

export default Drawer;
