import { Link } from 'react-router-dom';
import { useGetGroupsQuery } from '../services/api';
import { EmptyState, ErrorState, PageSkeleton } from '../components/common/States';

export function GroupsPage() {
  const { data, isLoading, isError, refetch } = useGetGroupsQuery();

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Groups</h1>
          <p className="subtitle">WhatsApp groups discovered from the connected provider</p>
        </div>
      </div>

      {isLoading ? (
        <PageSkeleton />
      ) : isError ? (
        <ErrorState detail="Groups could not be loaded." onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <div className="card">
          <EmptyState icon="👥" title="No groups found">
            <p>Connect a WhatsApp provider in Settings to discover groups.</p>
            <Link to="/settings" className="btn btn-secondary">Open settings</Link>
          </EmptyState>
        </div>
      ) : (
        <div className="kpi-grid">
          {data.map((g) => (
            <div key={g.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                <h2 style={{ margin: 0 }}>{g.name}</h2>
                <span className={`badge ${g.supported ? 'badge-success' : 'badge-warning'}`}>
                  {g.supported ? 'Supported' : 'Unsupported'}
                </span>
              </div>
              {g.description && <p className="muted" style={{ margin: 0 }}>{g.description}</p>}
              <p className="muted" style={{ margin: 0, fontSize: 'var(--text-xs)' }}>
                {g.memberCount} members · <span className="mono">{g.id}</span>
              </p>
              {g.supported ? (
                <Link to="/schedules/new" className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }}>
                  Schedule a message
                </Link>
              ) : (
                <p className="hint" style={{ margin: 0, color: 'var(--color-warning)' }}>
                  The current provider cannot send automated messages to this group.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
