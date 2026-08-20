import {
  useGetAiStatusQuery,
  useGetProviderQrQuery,
  useGetProviderStatusQuery,
} from '../services/api';
import { ErrorState, PageSkeleton } from '../components/common/States';
import { useAppSelector } from '../store/hooks';

export function SettingsPage() {
  const provider = useGetProviderStatusQuery(undefined, { pollingInterval: 5000 });
  const needsLink = provider.data ? !provider.data.connected : false;
  const qr = useGetProviderQrQuery(undefined, {
    pollingInterval: 5000,
    skip: !needsLink,
  });
  const ai = useGetAiStatusQuery();
  const user = useAppSelector((s) => s.auth.user);
  const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <div className="page" style={{ maxWidth: 760 }}>
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p className="subtitle">Provider status, timezone and application configuration</p>
        </div>
      </div>

      <div className="card">
        <h2>WhatsApp provider</h2>
        {provider.isLoading ? (
          <PageSkeleton />
        ) : provider.isError ? (
          <ErrorState detail="Provider status could not be loaded." onRetry={provider.refetch} />
        ) : provider.data && (
          <div className="form-grid">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className={`badge ${provider.data.connected ? 'badge-success' : 'badge-danger'}`}>
                {provider.data.connected ? 'Connected' : 'Disconnected'}
              </span>
              <strong>{provider.data.provider}</strong>
              <span className={`badge ${provider.data.groupMessagingSupported ? 'badge-success' : 'badge-warning'}`}>
                {provider.data.groupMessagingSupported ? 'Group messaging supported' : 'Group messaging unverified'}
              </span>
            </div>
            <p className="muted" style={{ margin: 0 }}>{provider.data.detail}</p>
            {needsLink && qr.data?.qr && (
              <div className="qr-panel">
                <img src={qr.data.qr} alt="WhatsApp pairing QR code" width={280} height={280} />
                <div>
                  <strong>Link your WhatsApp</strong>
                  <ol style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                    <li>Open WhatsApp on your phone</li>
                    <li>Tap ⋮ (menu) → <strong>Linked devices</strong></li>
                    <li>Tap <strong>Link a device</strong> and scan this QR</li>
                  </ol>
                  <p className="muted" style={{ marginTop: 8, fontSize: 'var(--text-xs)' }}>
                    This page refreshes automatically — once linked, real messages start flowing.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <h2>AI assist</h2>
        <p className="muted" style={{ margin: 0 }}>
          {ai.data?.enabled
            ? 'AI message drafting is enabled (OpenAI). Use it from the Messages page.'
            : 'AI message drafting is disabled. Set OPENAI_API_KEY in the API environment to enable it.'}
        </p>
      </div>

      <div className="card">
        <h2>Timezone</h2>
        <p className="muted" style={{ margin: 0 }}>
          Schedules run in their own configured IANA timezone (default <strong>Asia/Kolkata</strong>).
          Your browser timezone is <strong>{browserTz}</strong>; times in the console are shown in it.
        </p>
      </div>

      <div className="card">
        <h2>Account</h2>
        <p className="muted" style={{ margin: 0 }}>
          Signed in as <strong>{user?.name}</strong> ({user?.email}) — role: {user?.role}.
        </p>
      </div>
    </div>
  );
}
