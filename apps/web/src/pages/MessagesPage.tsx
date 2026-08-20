import { FormEvent, useState } from 'react';
import {
  useComposeAiMutation,
  useCreateTemplateMutation,
  useDeleteTemplateMutation,
  useGetAiStatusQuery,
  useGetTemplatesQuery,
  useUpdateTemplateMutation,
} from '../services/api';
import type { Template } from '../services/types';
import { EmptyState, ErrorState, PageSkeleton } from '../components/common/States';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { IconMessage } from '../components/common/Icons';
import { useAppDispatch } from '../store/hooks';
import { pushToast } from '../store/uiSlice';
import { apiErrorMessage } from '../lib/format';

export function MessagesPage() {
  const { data, isLoading, isError, refetch } = useGetTemplatesQuery();
  const aiStatus = useGetAiStatusQuery();
  const [createTemplate, { isLoading: creating }] = useCreateTemplateMutation();
  const [updateTemplate, { isLoading: updating }] = useUpdateTemplateMutation();
  const [deleteTemplate, { isLoading: deleting }] = useDeleteTemplateMutation();
  const [composeAi, { isLoading: composing }] = useComposeAiMutation();
  const dispatch = useAppDispatch();

  const [editing, setEditing] = useState<Template | null>(null);
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [bodyError, setBodyError] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Template | null>(null);

  const startEdit = (t: Template) => {
    setEditing(t);
    setName(t.name);
    setBody(t.body);
    setNameError(null);
    setBodyError(null);
  };

  const resetForm = () => {
    setEditing(null);
    setName('');
    setBody('');
    setNameError(null);
    setBodyError(null);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    let valid = true;
    if (!name.trim()) { setNameError('Template name is required.'); valid = false; }
    if (!body.trim()) { setBodyError('Message body is required.'); valid = false; }
    if (!valid) return;
    try {
      if (editing) {
        await updateTemplate({ id: editing.id, name, body }).unwrap();
        dispatch(pushToast({ kind: 'success', title: 'Template updated' }));
      } else {
        await createTemplate({ name, body }).unwrap();
        dispatch(pushToast({ kind: 'success', title: 'Template created' }));
      }
      resetForm();
    } catch (err) {
      dispatch(pushToast({ kind: 'error', title: 'Save failed', detail: apiErrorMessage(err) }));
    }
  };

  const onAiCompose = async () => {
    if (!aiPrompt.trim()) return;
    try {
      const result = await composeAi({ prompt: aiPrompt, tone: 'friendly' }).unwrap();
      setBody(result.message);
      setBodyError(null);
      dispatch(pushToast({ kind: 'success', title: 'AI draft ready', detail: 'Review and edit before saving.' }));
    } catch (err) {
      dispatch(pushToast({ kind: 'error', title: 'AI compose failed', detail: apiErrorMessage(err) }));
    }
  };

  const onDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteTemplate(pendingDelete.id).unwrap();
      dispatch(pushToast({ kind: 'success', title: `Deleted "${pendingDelete.name}"` }));
      if (editing?.id === pendingDelete.id) resetForm();
      setPendingDelete(null);
    } catch (err) {
      dispatch(pushToast({ kind: 'error', title: 'Delete failed', detail: apiErrorMessage(err) }));
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Messages</h1>
          <p className="subtitle">Reusable message templates with live preview</p>
        </div>
      </div>

      <div className="two-col">
        <form className="card form-grid" onSubmit={onSubmit} noValidate>
          <h2 style={{ margin: 0 }}>{editing ? `Edit “${editing.name}”` : 'New template'}</h2>
          <div className="field">
            <label htmlFor="t-name">Name <span className="required" aria-hidden="true">*</span></label>
            <input
              id="t-name"
              type="text"
              value={name}
              maxLength={120}
              onChange={(e) => { setName(e.target.value); setNameError(null); }}
              aria-invalid={nameError ? true : undefined}
              aria-describedby={nameError ? 't-name-error' : undefined}
              required
            />
            {nameError && <span id="t-name-error" className="error-text" role="alert">{nameError}</span>}
          </div>
          <div className="field">
            <label htmlFor="t-body">Message <span className="required" aria-hidden="true">*</span></label>
            <textarea
              id="t-body"
              value={body}
              onChange={(e) => { setBody(e.target.value); setBodyError(null); }}
              aria-invalid={bodyError ? true : undefined}
              aria-describedby={bodyError ? 't-body-error' : 't-body-hint'}
              required
            />
            <span id="t-body-hint" className="hint">Use {'{{group}}'} as a placeholder for the group name.</span>
            {bodyError && <span id="t-body-error" className="error-text" role="alert">{bodyError}</span>}
          </div>

          {aiStatus.data?.enabled && (
            <div className="field">
              <label htmlFor="t-ai">AI assist</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  id="t-ai"
                  type="text"
                  value={aiPrompt}
                  placeholder="e.g. cheerful monsoon-morning greeting"
                  maxLength={500}
                  onChange={(e) => setAiPrompt(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onAiCompose}
                  disabled={composing || !aiPrompt.trim()}
                >
                  {composing ? 'Writing…' : 'Draft with AI'}
                </button>
              </div>
              <span className="hint">Generates a draft into the message field — always review before saving.</span>
            </div>
          )}

          {body.trim() && (
            <div className="message-preview" aria-label="Message preview">
              <div className="message-bubble">{body}</div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            {editing && (
              <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel edit</button>
            )}
            <button type="submit" className="btn btn-primary" disabled={creating || updating}>
              {creating || updating ? 'Saving…' : editing ? 'Update template' : 'Save template'}
            </button>
          </div>
        </form>

        <div className="card">
          <h2>Templates</h2>
          {isLoading ? (
            <PageSkeleton />
          ) : isError ? (
            <ErrorState detail="Templates could not be loaded." onRetry={refetch} />
          ) : !data || data.length === 0 ? (
            <EmptyState icon={<IconMessage size={32} />} title="No templates yet">
              <p>Create a reusable message on the left.</p>
            </EmptyState>
          ) : (
            <div className="list-stack">
              {data.map((t) => (
                <div key={t.id} className="list-item">
                  <div style={{ minWidth: 0 }}>
                    <strong>{t.name}</strong>
                    <div className="muted" style={{ fontSize: 'var(--text-xs)', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                      {t.body.length > 120 ? `${t.body.slice(0, 120)}…` : t.body}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => startEdit(t)}>Edit</button>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => setPendingDelete(t)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete template?"
        message={`"${pendingDelete?.name}" will be removed. Schedules already using its text are unaffected.`}
        busy={deleting}
        onConfirm={onDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
