import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  useCreateScheduleMutation,
  useGetGroupsQuery,
  useGetScheduleQuery,
  useGetTemplatesQuery,
  useSendTestMutation,
  useUpdateScheduleMutation,
} from '../services/api';
import type { Frequency } from '../services/types';
import { ErrorState, PageSkeleton } from '../components/common/States';
import { useAppDispatch } from '../store/hooks';
import { pushToast } from '../store/uiSlice';
import { apiErrorMessage } from '../lib/format';

const TIMEZONES = [
  'Asia/Kolkata', 'UTC', 'America/New_York', 'America/Los_Angeles',
  'Europe/London', 'Europe/Berlin', 'Asia/Singapore', 'Asia/Dubai',
  'Asia/Tokyo', 'Australia/Sydney',
];

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const FREQUENCY_LABELS: Record<Frequency, string> = {
  daily: 'Every day',
  weekdays: 'Weekdays (Mon–Fri)',
  weekends: 'Weekends (Sat–Sun)',
  weekly: 'Weekly',
};

interface FormState {
  name: string;
  targetGroupId: string;
  message: string;
  frequency: Frequency;
  time: string;
  timezone: string;
  weekday: number;
  enabled: boolean;
}

const DEFAULTS: FormState = {
  name: '',
  targetGroupId: '',
  message: '',
  frequency: 'daily',
  time: '04:30',
  timezone: 'Asia/Kolkata',
  weekday: 1,
  enabled: true,
};

function summarize(form: FormState): string {
  const when =
    form.frequency === 'weekly'
      ? `Every ${WEEKDAYS[form.weekday]}`
      : FREQUENCY_LABELS[form.frequency].replace(/ \(.*\)/, '');
  return `${when} at ${form.time} (${form.timezone})`;
}

export function ScheduleFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const groups = useGetGroupsQuery();
  const templates = useGetTemplatesQuery();
  const existing = useGetScheduleQuery(id ?? '', { skip: !isEdit });
  const [create, { isLoading: creating }] = useCreateScheduleMutation();
  const [update, { isLoading: updating }] = useUpdateScheduleMutation();
  const [sendTest, { isLoading: testing }] = useSendTestMutation();

  const [form, setForm] = useState<FormState>(DEFAULTS);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    if (existing.data) {
      const s = existing.data;
      setForm({
        name: s.name,
        targetGroupId: s.targetGroupId,
        message: s.message,
        frequency: s.frequency,
        time: s.time,
        timezone: s.timezone,
        weekday: s.weekday ?? 1,
        enabled: s.enabled,
      });
    }
  }, [existing.data]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const supportedGroups = useMemo(
    () => (groups.data ?? []).filter((g) => g.supported),
    [groups.data],
  );

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = 'Automation name is required.';
    if (!form.targetGroupId) next.targetGroupId = 'Choose a WhatsApp group.';
    if (!form.message.trim()) next.message = 'Message text is required.';
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(form.time)) next.time = 'Enter a valid time (HH:mm).';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const payload = () => ({
    name: form.name.trim(),
    targetGroupId: form.targetGroupId,
    message: form.message,
    schedule: {
      frequency: form.frequency,
      time: form.time,
      timezone: form.timezone,
      ...(form.frequency === 'weekly' ? { weekday: form.weekday } : {}),
    },
    enabled: form.enabled,
  });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      if (isEdit && id) {
        await update({ id, ...payload() }).unwrap();
        dispatch(pushToast({ kind: 'success', title: 'Automation updated' }));
      } else {
        await create(payload()).unwrap();
        dispatch(pushToast({ kind: 'success', title: 'Automation created', detail: summarize(form) }));
      }
      navigate('/schedules');
    } catch (err) {
      dispatch(pushToast({ kind: 'error', title: 'Save failed', detail: apiErrorMessage(err) }));
    }
  };

  const onTest = async () => {
    if (!isEdit || !id) return;
    try {
      const result = await sendTest(id).unwrap();
      dispatch(pushToast(
        result.status === 'FAILED'
          ? { kind: 'error', title: 'Test send failed', detail: result.errorMessage ?? 'Provider error' }
          : { kind: 'success', title: 'Test message sent' },
      ));
    } catch (err) {
      dispatch(pushToast({ kind: 'error', title: 'Test send failed', detail: apiErrorMessage(err) }));
    }
  };

  if (isEdit && existing.isLoading) return <div className="page"><PageSkeleton /></div>;
  if (isEdit && existing.isError) {
    return (
      <div className="page">
        <ErrorState detail="This automation could not be loaded." onRetry={existing.refetch} />
      </div>
    );
  }

  const busy = creating || updating;

  return (
    <div className="page" style={{ maxWidth: 760 }}>
      <div className="page-header">
        <div>
          <h1>{isEdit ? 'Edit automation' : 'Create automation'}</h1>
          <p className="subtitle">
            {isEdit ? 'Update this scheduled notification' : 'Schedule a recurring WhatsApp message'}
          </p>
        </div>
        <Link to="/schedules" className="btn btn-secondary">Back to schedules</Link>
      </div>

      <form className="card form-grid" onSubmit={onSubmit} noValidate>
        <div className="field">
          <label htmlFor="f-name">Name <span className="required" aria-hidden="true">*</span></label>
          <input
            id="f-name"
            type="text"
            value={form.name}
            maxLength={120}
            placeholder="Morning Good Morning Message"
            onChange={(e) => set('name', e.target.value)}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? 'f-name-error' : undefined}
            required
          />
          {errors.name && <span id="f-name-error" className="error-text" role="alert">{errors.name}</span>}
        </div>

        <div className="field">
          <label htmlFor="f-group">WhatsApp group <span className="required" aria-hidden="true">*</span></label>
          <select
            id="f-group"
            value={form.targetGroupId}
            onChange={(e) => set('targetGroupId', e.target.value)}
            aria-invalid={errors.targetGroupId ? true : undefined}
            aria-describedby={errors.targetGroupId ? 'f-group-error' : 'f-group-hint'}
            required
          >
            <option value="">Select a group…</option>
            {supportedGroups.map((g) => (
              <option key={g.id} value={g.id}>{g.name} ({g.memberCount} members)</option>
            ))}
          </select>
          <span id="f-group-hint" className="hint">Only groups supported by the connected provider are listed.</span>
          {errors.targetGroupId && (
            <span id="f-group-error" className="error-text" role="alert">{errors.targetGroupId}</span>
          )}
        </div>

        <div className="field">
          <label htmlFor="f-message">Message <span className="required" aria-hidden="true">*</span></label>
          {(templates.data?.length ?? 0) > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
              {templates.data!.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => set('message', t.body)}
                >
                  Use “{t.name}”
                </button>
              ))}
            </div>
          )}
          <textarea
            id="f-message"
            value={form.message}
            maxLength={4096}
            placeholder="Good Morning! Have a productive day! 🌞"
            onChange={(e) => set('message', e.target.value)}
            aria-invalid={errors.message ? true : undefined}
            aria-describedby={errors.message ? 'f-message-error' : undefined}
            required
          />
          {errors.message && <span id="f-message-error" className="error-text" role="alert">{errors.message}</span>}
        </div>

        {form.message.trim() && (
          <div className="message-preview" aria-label="Message preview">
            <div className="message-bubble">{form.message}</div>
          </div>
        )}

        <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
          <legend style={{ fontWeight: 600, marginBottom: 8 }}>Schedule</legend>
          <div className="form-row">
            <div className="field">
              <label htmlFor="f-frequency">Frequency</label>
              <select
                id="f-frequency"
                value={form.frequency}
                onChange={(e) => set('frequency', e.target.value as Frequency)}
              >
                {(Object.keys(FREQUENCY_LABELS) as Frequency[]).map((f) => (
                  <option key={f} value={f}>{FREQUENCY_LABELS[f]}</option>
                ))}
              </select>
            </div>
            {form.frequency === 'weekly' && (
              <div className="field">
                <label htmlFor="f-weekday">Day of week</label>
                <select
                  id="f-weekday"
                  value={form.weekday}
                  onChange={(e) => set('weekday', Number(e.target.value))}
                >
                  {WEEKDAYS.map((d, i) => (
                    <option key={d} value={i}>{d}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="field">
              <label htmlFor="f-time">Time <span className="required" aria-hidden="true">*</span></label>
              <input
                id="f-time"
                type="time"
                value={form.time}
                onChange={(e) => set('time', e.target.value)}
                aria-invalid={errors.time ? true : undefined}
                aria-describedby={errors.time ? 'f-time-error' : undefined}
                required
              />
              {errors.time && <span id="f-time-error" className="error-text" role="alert">{errors.time}</span>}
            </div>
            <div className="field">
              <label htmlFor="f-timezone">Timezone</label>
              <select
                id="f-timezone"
                value={form.timezone}
                onChange={(e) => set('timezone', e.target.value)}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>

        <p className="schedule-summary" role="status">
          <strong>Summary:</strong> {summarize(form)}
        </p>

        <div className="field">
          <label className="switch" htmlFor="f-enabled">
            <input
              id="f-enabled"
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => set('enabled', e.target.checked)}
            />
            <span className="track" aria-hidden="true"></span>
            <span>{form.enabled ? 'Active — runs on schedule' : 'Paused — will not run'}</span>
          </label>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {isEdit && (
            <button type="button" className="btn btn-secondary" onClick={onTest} disabled={testing}>
              {testing ? 'Sending…' : 'Send test'}
            </button>
          )}
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Saving…' : 'Save automation'}
          </button>
        </div>
      </form>
    </div>
  );
}
