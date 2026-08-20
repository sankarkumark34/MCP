import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useAddContactMutation,
  useCreateGroupMutation,
  useDeleteGroupMutation,
  useGetGroupDetailsQuery,
  useGetGroupsQuery,
  useRemoveContactMutation,
} from '../services/api';
import type { Group } from '../services/types';
import { EmptyState, ErrorState, PageSkeleton, Skeleton } from '../components/common/States';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { IconPlus, IconSearch, IconUsers } from '../components/common/Icons';
import { useAppDispatch } from '../store/hooks';
import { pushToast } from '../store/uiSlice';
import { apiErrorMessage } from '../lib/format';

function ListMembers({ listId }: { listId: string }) {
  const { data, isLoading } = useGetGroupDetailsQuery(listId);
  const [addContact, { isLoading: adding }] = useAddContactMutation();
  const [removeContact] = useRemoveContactMutation();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const dispatch = useAppDispatch();

  const onAdd = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !phone.trim()) {
      setError('Both name and phone number are required.');
      return;
    }
    try {
      await addContact({ listId, name, phone }).unwrap();
      setName('');
      setPhone('');
      dispatch(pushToast({ kind: 'success', title: 'Recipient added' }));
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  const onRemove = async (contactId: string, contactName: string) => {
    try {
      await removeContact({ listId, contactId }).unwrap();
      dispatch(pushToast({ kind: 'success', title: `Removed ${contactName}` }));
    } catch (err) {
      dispatch(pushToast({ kind: 'error', title: 'Remove failed', detail: apiErrorMessage(err) }));
    }
  };

  if (isLoading) return <Skeleton height={60} />;

  return (
    <div className="form-grid" style={{ gap: 'var(--space-3)' }}>
      {(data?.members.length ?? 0) === 0 ? (
        <p className="muted" style={{ margin: 0, fontSize: 'var(--text-xs)' }}>
          No recipients yet — add phone numbers below.
        </p>
      ) : (
        <ul className="member-list">
          {data!.members.map((m) => (
            <li key={m.id}>
              <span>
                <strong>{m.name}</strong>{' '}
                <span className="mono muted">{m.phone}</span>
              </span>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => onRemove(m.id, m.name)}
                aria-label={`Remove ${m.name}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <form className="contact-add" onSubmit={onAdd} noValidate>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor={`name-${listId}`} className="visually-compact">Name</label>
          <input
            id={`name-${listId}`}
            type="text"
            placeholder="Name"
            value={name}
            maxLength={120}
            onChange={(e) => { setName(e.target.value); setError(null); }}
          />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label htmlFor={`phone-${listId}`} className="visually-compact">Phone</label>
          <input
            id={`phone-${listId}`}
            type="tel"
            placeholder="+919876543210"
            value={phone}
            maxLength={20}
            onChange={(e) => { setPhone(e.target.value); setError(null); }}
            aria-invalid={error ? true : undefined}
          />
        </div>
        <button type="submit" className="btn btn-secondary" disabled={adding} style={{ alignSelf: 'flex-end' }}>
          {adding ? 'Adding…' : 'Add'}
        </button>
      </form>
      {error && <span className="error-text" role="alert">{error}</span>}
    </div>
  );
}

export function GroupsPage() {
  const { data, isLoading, isError, refetch } = useGetGroupsQuery();
  const [createGroup, { isLoading: creating }] = useCreateGroupMutation();
  const [deleteGroup, { isLoading: deleting }] = useDeleteGroupMutation();
  const [search, setSearch] = useState('');
  const [newList, setNewList] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Group | null>(null);
  const dispatch = useAppDispatch();

  const filtered = (data ?? []).filter((g) =>
    g.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const onCreateList = async (e: FormEvent) => {
    e.preventDefault();
    if (!newList.trim()) return;
    try {
      await createGroup({ name: newList }).unwrap();
      setNewList('');
      dispatch(pushToast({ kind: 'success', title: 'Recipient list created' }));
    } catch (err) {
      dispatch(pushToast({ kind: 'error', title: 'Create failed', detail: apiErrorMessage(err) }));
    }
  };

  const onDeleteList = async () => {
    if (!pendingDelete) return;
    try {
      await deleteGroup(pendingDelete.id).unwrap();
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
          <h1>Recipients</h1>
          <p className="subtitle">
            Named lists of individual phone numbers — everyone in a list is notified in parallel
          </p>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <IconSearch size={16} />
          <input
            type="search"
            aria-label="Search recipient lists"
            placeholder="Search lists…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <form onSubmit={onCreateList} style={{ display: 'flex', gap: 8, flex: '1 1 260px' }}>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="new-list" className="visually-compact">New list name</label>
            <input
              id="new-list"
              type="text"
              placeholder="New list name…"
              value={newList}
              maxLength={120}
              onChange={(e) => setNewList(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={creating || !newList.trim()}>
            <IconPlus size={16} /> Create list
          </button>
        </form>
      </div>

      {isLoading ? (
        <PageSkeleton />
      ) : isError ? (
        <ErrorState detail="Recipient lists could not be loaded." onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <div className="card">
          <EmptyState icon={<IconUsers size={32} />} title="No recipient lists yet">
            <p>Create a list above, then add the phone numbers you want to notify.</p>
          </EmptyState>
        </div>
      ) : (
        <div className="list-grid">
          {filtered.map((g) => (
            <div key={g.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ margin: 0 }}>{g.name}</h2>
                  {g.description && (
                    <p className="muted" style={{ margin: '4px 0 0', fontSize: 'var(--text-xs)' }}>{g.description}</p>
                  )}
                </div>
                <span className={`badge ${g.supported ? 'badge-success' : 'badge-warning'}`}>
                  {g.supported ? `${g.memberCount} recipient${g.memberCount === 1 ? '' : 's'}` : 'Disabled'}
                </span>
              </div>
              {g.supported ? (
                <>
                  <ListMembers listId={g.id} />
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between' }}>
                    <Link to="/schedules/new" className="btn btn-secondary btn-sm">
                      Schedule a message
                    </Link>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => setPendingDelete(g)}
                    >
                      Delete list
                    </button>
                  </div>
                </>
              ) : (
                <p className="hint" style={{ margin: 0, color: 'var(--color-warning)' }}>
                  This list is disabled for automated messaging.
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete recipient list?"
        message={`"${pendingDelete?.name}" and its ${pendingDelete?.memberCount ?? 0} recipient(s) will be removed. Schedules targeting it will stop delivering.`}
        busy={deleting}
        onConfirm={onDeleteList}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
