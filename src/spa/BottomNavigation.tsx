import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import BottomNavigation from '@material-ui/core/BottomNavigation';
import BottomNavigationAction from '@material-ui/core/BottomNavigationAction';
import ListTwoToneIcon from '@material-ui/icons/ListTwoTone';
import HomeTwoToneIcon from '@material-ui/icons/HomeTwoTone';
import ExpandLessTwoToneIcon from '@material-ui/icons/ExpandLessTwoTone';
import { useHistory } from 'react-router-dom';

const useStyles = makeStyles({
  footer: {
    position: 'fixed',
    bottom: 0,
    left: '25%',
    width: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

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

  requestAnimationFrame(step);
};

const BottomNav = ({ toggleMenu }: {toggleMenu: () => (e: React.KeyboardEvent | React.MouseEvent) => void}) => {
  const classes = useStyles();
  const [value, setValue] = React.useState(0);
  const history = useHistory();

  return (
    <footer className={classes.footer}>
      <BottomNavigation
        value={value}
        onChange={(event, newValue) => {
          setValue(newValue);
        }}
        showLabels
      >
        <BottomNavigationAction label="Menu" icon={<ListTwoToneIcon />} onClick={toggleMenu()} />
        <BottomNavigationAction label="Home" icon={<HomeTwoToneIcon />} onClick={() => history.push('/')} />
        <BottomNavigationAction
          label="BackTop"
          icon={(<ExpandLessTwoToneIcon />)}
          onClick={() => backTop()}
        />
      </BottomNavigation>
    </footer>
  );
};

export default BottomNav;
