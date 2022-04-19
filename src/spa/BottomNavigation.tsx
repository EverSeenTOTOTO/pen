import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Fab from '@material-ui/core/Fab';
import ExpandLessTwoToneIcon from '@material-ui/icons/ExpandLessTwoTone';

const useStyles = makeStyles((theme) => ({
  fab: {
    position: 'fixed',
    zIndex: 999,
    bottom: theme.spacing(4),
    right: theme.spacing(2),
  },
}));

const backTop = (destination = 0) => {
  const rate = 4;
  const scrollTo = (posY: number) => window.scrollTo(0, posY);
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
  let position = scrollTop + (destination - scrollTop) / rate;

  const step = () => {
    if (Math.abs(position) < 10) {
      scrollTo(0);
    } else {
      scrollTo(position);
      position += (destination - position) / rate;
      requestAnimationFrame(step);
    }
  };

  step();
};

const BottomNav = () => {
  const classes = useStyles();

  return (
    <Fab
      aria-label="BackTop"
      className={classes.fab}
      color="primary"
      onClick={() => backTop()}
    >
      <ExpandLessTwoToneIcon />
    </Fab>
  );
};

export default BottomNav;
