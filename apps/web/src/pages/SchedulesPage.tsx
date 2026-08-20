import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useDeleteScheduleMutation,
  useGetSchedulesQuery,
  usePauseScheduleMutation,
  useResumeScheduleMutation,
  useSendTestMutation,
} from '../services/api';
import { EmptyState, ErrorState, PageSkeleton } from '../components/common/States';
import { EnabledBadge } from '../components/common/StatusBadge';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useAppDispatch } from '../store/hooks';
import { pushToast } from '../store/uiSlice';
import { apiErrorMessage, formatDateTime } from '../lib/format';

export function SchedulesPage() {
  const { data, isLoading, isError, refetch } = useGetSchedulesQuery();
  const [pause] = usePauseScheduleMutation();
  const [resume] = useResumeScheduleMutation();
  const [sendTest, { isLoading: testing }] = useSendTestMutation();
  const [remove, { isLoading: deleting }] = useDeleteScheduleMutation();
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const dispatch = useAppDispatch();

  const onToggle = async (id: string, enabled: boolean) => {
    try {
      await (enabled ? pause(id) : resume(id)).unwrap();
      dispatch(pushToast({ kind: 'success', title: enabled ? 'Automation paused' : 'Automation resumed' }));
    } catch (err) {
      dispatch(pushToast({ kind: 'error', title: 'Update failed', detail: apiErrorMessage(err) }));
    }
  };

  const onTest = async (id: string, name: string) => {
    try {
      const result = await sendTest(id).unwrap();
      if (result.status === 'FAILED') {
        dispatch(pushToast({
          kind: 'error',
          title: `Test send failed for "${name}"`,
          detail: result.errorMessage ?? 'Provider error — see history for details.',
        }));
      } else {
        dispatch(pushToast({
          kind: 'success',
          title: 'Test message sent',
          detail: `Delivered after ${result.attemptCount} attempt(s).`,
        }));
      }
    } catch (err) {
      dispatch(pushToast({ kind: 'error', title: 'Test send failed', detail: apiErrorMessage(err) }));
    }
  };

  const onDelete = async () => {
    if (!pendingDelete) return;
    try {
      await remove(pendingDelete.id).unwrap();
      dispatch(pushToast({ kind: 'success', title: `Deleted "${pendingDelete.name}"` }));
      setPendingDelete(null);
    } catch (err) {
      dispatch(pushToast({ kind: 'error', title: 'Delete failed', detail: apiErrorMessage(err) }));
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Schedules</h1>
          <p className="subtitle">Create, pause and manage notification automations</p>
        </div>
        <Link to="/schedules/new" className="btn btn-primary">+ New automation</Link>
      </div>

      {isLoading ? (
        <PageSkeleton />
      ) : isError ? (
        <ErrorState detail="Schedules could not be loaded." onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <div className="card">
          <EmptyState icon="🗓️" title="No automations yet">
            <p>Create your first scheduled WhatsApp message.</p>
            <Link to="/schedules/new" className="btn btn-primary">Create automation</Link>
          </EmptyState>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Group</th>
                <th scope="col">Schedule</th>
                <th scope="col">Next run</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((s) => (
                <tr key={s.id}>
                  <td><Link to={`/schedules/${s.id}`} style={{ fontWeight: 600 }}>{s.name}</Link></td>
                  <td>{s.groupName ?? s.targetGroupId}</td>
                  <td>{s.summary}</td>
                  <td>{formatDateTime(s.nextRunAt)}</td>
                  <td><EnabledBadge enabled={s.enabled} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => onToggle(s.id, s.enabled)}>
                        {s.enabled ? 'Pause' : 'Resume'}
                      </button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => onTest(s.id, s.name)} disabled={testing}>
                        Send test
                      </button>
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => setPendingDelete({ id: s.id, name: s.name })}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete automation?"
        message={`"${pendingDelete?.name}" and its future runs will be removed. Execution history is kept.`}
        busy={deleting}
        onConfirm={onDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
