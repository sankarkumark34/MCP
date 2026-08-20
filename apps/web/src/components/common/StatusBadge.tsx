import type { ExecutionStatus } from '../../services/types';

const STATUS_STYLES: Record<ExecutionStatus, string> = {
  SENT: 'badge-success',
  RETRIED: 'badge-warning',
  FAILED: 'badge-danger',
  PENDING: 'badge-info',
  SKIPPED: 'badge-muted',
};

export function StatusBadge({ status }: { status: ExecutionStatus }) {
  return <span className={`badge ${STATUS_STYLES[status] ?? 'badge-muted'}`}>{status}</span>;
}

export function EnabledBadge({ enabled }: { enabled: boolean }) {
  return (
    <span className={`badge ${enabled ? 'badge-success' : 'badge-muted'}`}>
      {enabled ? 'Active' : 'Paused'}
    </span>
  );
}
