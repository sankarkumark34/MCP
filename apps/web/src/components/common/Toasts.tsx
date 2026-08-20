import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { dismissToast, Toast } from '../../store/uiSlice';

function ToastItem({ toast }: { toast: Toast }) {
  const dispatch = useAppDispatch();
  useEffect(() => {
    const timer = setTimeout(() => dispatch(dismissToast(toast.id)), 5000);
    return () => clearTimeout(timer);
  }, [dispatch, toast.id]);

  return (
    <div className={`toast ${toast.kind}`} role="status">
      <strong>{toast.title}</strong>
      {toast.detail && <div className="muted" style={{ marginTop: 4 }}>{toast.detail}</div>}
    </div>
  );
}

export function ToastRegion() {
  const toasts = useAppSelector((s) => s.ui.toasts);
  if (toasts.length === 0) return null;
  return (
    <div className="toast-region" aria-live="polite">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
