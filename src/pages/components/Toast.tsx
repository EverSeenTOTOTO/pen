import { observer } from 'mobx-react-lite';
import { useStore } from '@/store';

const Toast = observer(() => {
  const ui = useStore('ui');
  return (
    <div
      className={`toast ${ui.message ? 'toast-visible' : ''} toast-${ui.severity}`}
      role="status"
      aria-live="polite"
    >
      {ui.message}
    </div>
  );
});

export default Toast;
