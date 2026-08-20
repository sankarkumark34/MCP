import { Link } from 'react-router-dom';
import { useGetDashboardQuery } from '../services/api';
import { useAppSelector } from '../store/hooks';
import { DeliveryChart } from '../components/dashboard/DeliveryChart';
import { EmptyState, ErrorState, PageSkeleton } from '../components/common/States';
import { IconCalendar, IconClock, IconPlus } from '../components/common/Icons';
import { StatusBadge, EnabledBadge } from '../components/common/StatusBadge';
import { formatDateTime, formatRelative } from '../lib/format';

export function DashboardPage() {
  const user = useAppSelector((s) => s.auth.user);
  const { data, isLoading, isError, refetch } = useGetDashboardQuery(undefined, {
    pollingInterval: 30_000,
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (isLoading) {
    return <div className="page"><PageSkeleton /></div>;
  }
  if (isError || !data) {
    return (
      <div className="page">
        <ErrorState detail="The dashboard could not be loaded." onRetry={refetch} />
      </div>
    );
  }

  const { kpis } = data;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{greeting}, {user?.name ?? 'there'}</h1>
          <p className="subtitle">Automation overview</p>
        </div>
        <Link to="/schedules/new" className="btn btn-primary"><IconPlus size={16} /> New automation</Link>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">Active automations</span>
          <span className="kpi-value">{kpis.activeAutomations}</span>
          <span className="kpi-hint">of {kpis.totalAutomations} total</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Sent (14 days)</span>
          <span className="kpi-value" style={{ color: 'var(--color-success)' }}>{kpis.messagesSent}</span>
          <span className="kpi-hint">successful deliveries</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Failed (14 days)</span>
          <span className="kpi-value" style={{ color: kpis.messagesFailed > 0 ? 'var(--color-danger)' : undefined }}>
            {kpis.messagesFailed}
          </span>
          <span className="kpi-hint">after all retries</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Next run</span>
          <span className="kpi-value" style={{ fontSize: 'var(--text-lg)' }}>
            {formatDateTime(kpis.nextRunAt)}
          </span>
          <span className="kpi-hint">
            {kpis.nextRunName ? `${kpis.nextRunName} · ${formatRelative(kpis.nextRunAt)}` : 'no upcoming runs'}
          </span>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <h2>Delivery trend</h2>
          <DeliveryChart data={data.deliveryTrend} />
        </div>
        <div className="card">
          <h2>Active automations</h2>
          {data.activeAutomations.length === 0 ? (
            <EmptyState icon={<IconCalendar size={32} />} title="No active automations">
              <Link to="/schedules/new" className="btn btn-primary">Create your first automation</Link>
            </EmptyState>
          ) : (
            <div className="list-stack">
              {data.activeAutomations.map((a) => (
                <div key={a.id} className="list-item">
                  <div style={{ minWidth: 0 }}>
                    <Link to={`/schedules/${a.id}`} style={{ fontWeight: 600 }}>{a.name}</Link>
                    <div className="muted" style={{ fontSize: 'var(--text-xs)' }}>{a.summary}</div>
                  </div>
                  <EnabledBadge enabled={a.enabled} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h2>Recent activity</h2>
        {data.recentActivity.length === 0 ? (
          <EmptyState icon={<IconClock size={32} />} title="No executions yet">
            <p>Once your automations run (or you send a test), activity appears here.</p>
          </EmptyState>
        ) : (
          <div className="table-wrap" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Time</th>
                  <th scope="col">Status</th>
                  <th scope="col">Attempts</th>
                  <th scope="col">Message ID</th>
                  <th scope="col">Type</th>
                </tr>
              </thead>
              <tbody>
                {data.recentActivity.map((e) => (
                  <tr key={e.id}>
                    <td>{formatDateTime(e.createdAt)}</td>
                    <td><StatusBadge status={e.status} /></td>
                    <td>{e.attemptCount}</td>
                    <td className="mono">{e.providerMessageId ?? '—'}</td>
                    <td>{e.isTest ? 'Test' : 'Scheduled'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
