import { useState } from 'react';
import { useGetHistoryQuery, useGetSchedulesQuery } from '../services/api';
import { EmptyState, ErrorState, PageSkeleton } from '../components/common/States';
import { StatusBadge } from '../components/common/StatusBadge';
import { IconClock } from '../components/common/Icons';
import { formatDateTime } from '../lib/format';

const STATUSES = ['', 'SENT', 'RETRIED', 'FAILED', 'SKIPPED', 'PENDING'] as const;
const PAGE_SIZE = 25;

export function HistoryPage() {
  const [status, setStatus] = useState('');
  const [scheduleId, setScheduleId] = useState('');
  const [page, setPage] = useState(0);

  const schedules = useGetSchedulesQuery();
  const { data, isLoading, isError, refetch } = useGetHistoryQuery({
    status: status || undefined,
    scheduleId: scheduleId || undefined,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>History</h1>
          <p className="subtitle">Every execution — successes, retries, failures and skips</p>
        </div>
      </div>

      <div className="card">
        <div className="form-row" style={{ marginBottom: 'var(--space-4)' }}>
          <div className="field">
            <label htmlFor="h-status">Status</label>
            <select
              id="h-status"
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(0); }}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s === '' ? 'All statuses' : s}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="h-schedule">Automation</label>
            <select
              id="h-schedule"
              value={scheduleId}
              onChange={(e) => { setScheduleId(e.target.value); setPage(0); }}
            >
              <option value="">All automations</option>
              {(schedules.data ?? []).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <PageSkeleton />
        ) : isError ? (
          <ErrorState detail="History could not be loaded." onRetry={refetch} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState icon={<IconClock size={32} />} title="No executions match">
            <p>Executions appear here after schedules run or test messages are sent.</p>
          </EmptyState>
        ) : (
          <>
            <div className="table-wrap" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Time</th>
                    <th scope="col">Automation</th>
                    <th scope="col">Status</th>
                    <th scope="col">Attempts</th>
                    <th scope="col">Duration</th>
                    <th scope="col">Message ID</th>
                    <th scope="col">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((e) => (
                    <tr key={e.id}>
                      <td>{formatDateTime(e.createdAt)}</td>
                      <td>
                        {e.scheduleName}
                        {e.isTest && <span className="badge badge-info" style={{ marginLeft: 6 }}>Test</span>}
                      </td>
                      <td><StatusBadge status={e.status} /></td>
                      <td>{e.attemptCount}</td>
                      <td>{e.durationMs != null ? `${e.durationMs} ms` : '—'}</td>
                      <td className="mono">{e.providerMessageId ?? '—'}</td>
                      <td>
                        {e.errorMessage ? (
                          <span className="error-text">[{e.errorCode}] {e.errorMessage}</span>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-4)' }}>
              <span className="muted">{data.total} execution(s)</span>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Previous
                </button>
                <span className="muted">Page {page + 1} of {totalPages}</span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
