import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import BottomNavigation from '@material-ui/core/BottomNavigation';
import BottomNavigationAction from '@material-ui/core/BottomNavigationAction';
import ListTwoToneIcon from '@material-ui/icons/ListTwoTone';
import HomeTwoToneIcon from '@material-ui/icons/HomeTwoTone';
import ExpandLessTwoToneIcon from '@material-ui/icons/ExpandLessTwoTone';

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

/**

* 缓冲函数

* @param {Number} position 当前滚动位置

* @param {Number} destination 目标位置

* @param {Number} rate 缓动率

* @param {Function} callback 缓动结束回调函数 两个参数分别是当前位置和是否结束

*/

const backTop = (destination = 0) => {
  const rate = 4;
  const scrollTo = (posY: number) => window.scrollTo(0, posY);
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
  let position = scrollTop + (destination - scrollTop) / rate;

  const step = () => {
    console.log(scrollTop, position);

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

const BottomNav = ({ toggleMenu, backHome }: {toggleMenu: () => (e: React.KeyboardEvent | React.MouseEvent) => void, backHome: () => void}) => {
  const classes = useStyles();
  const [value, setValue] = React.useState(0);

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
        <BottomNavigationAction label="Home" icon={<HomeTwoToneIcon />} onClick={backHome} />
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
