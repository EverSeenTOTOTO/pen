import { observer } from 'mobx-react-lite';
import { useStore } from '@/store';
import Icon from './Icon';

const ThemeToggle = observer(() => {
  const theme = useStore('theme');
  const dark = theme.mode === 'dark';
  return (
    <button
      type="button"
      className="icon-btn"
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={() => theme.changeTheme(dark ? 'light' : 'dark')}
    >
      <Icon name={dark ? 'sun' : 'moon'} />
    </button>
  );
});

export default ThemeToggle;
