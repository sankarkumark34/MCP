import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoginMutation } from '../services/api';
import { useAppDispatch } from '../store/hooks';
import { setCredentials } from '../store/authSlice';
import { apiErrorMessage } from '../lib/format';

export function LoginPage() {
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const result = await login({ email, password }).unwrap();
      dispatch(setCredentials({ token: result.accessToken, user: result.user }));
      navigate('/dashboard');
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div style={{ textAlign: 'center' }}>
          <div className="sidebar-brand" style={{ justifyContent: 'center' }}>
            <span className="logo" aria-hidden="true">WA</span>
            <span>WhatsApp Automation</span>
          </div>
          <p className="muted">Sign in to your automation console</p>
        </div>
        <form className="card form-grid" onSubmit={onSubmit} noValidate>
          <div className="field">
            <label htmlFor="login-email">
              Email <span className="required" aria-hidden="true">*</span>
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="login-password">
              Password <span className="required" aria-hidden="true">*</span>
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'login-error' : undefined}
            />
            {error && (
              <span id="login-error" className="error-text" role="alert">
                {error}
              </span>
            )}
          </div>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
