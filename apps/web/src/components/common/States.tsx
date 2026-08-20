import { ReactNode } from 'react';

export function EmptyState({
  icon = '📭',
  title,
  children,
}: {
  icon?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty-state" role="status">
      <span className="icon" aria-hidden="true">{icon}</span>
      <h3>{title}</h3>
      {children}
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  detail,
  onRetry,
}: {
  title?: string;
  detail?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="error-state" role="alert">
      <h3>{title}</h3>
      {detail && <p className="muted">{detail}</p>}
      {onRetry && (
        <button type="button" className="btn btn-secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function Skeleton({ height = 20, width = '100%' }: { height?: number; width?: string | number }) {
  return <div className="skeleton" style={{ height, width }} aria-hidden="true" />;
}

export function PageSkeleton() {
  return (
    <div className="form-grid" aria-busy="true" aria-label="Loading">
      <Skeleton height={90} />
      <Skeleton height={220} />
      <Skeleton height={160} />
    </div>
  );
}
