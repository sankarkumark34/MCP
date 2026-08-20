import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/authSlice';
import { ToastRegion } from '../common/Toasts';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/schedules', label: 'Schedules', icon: '🗓️' },
  { to: '/groups', label: 'Groups', icon: '👥' },
  { to: '/messages', label: 'Messages', icon: '💬' },
  { to: '/history', label: 'History', icon: '🕘' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

export function AppShell() {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="logo" aria-hidden="true">WA</span>
          <span>WhatsApp Automation</span>
        </div>
        <nav aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <span className="muted">Automation console</span>
          <div className="user-chip">
            <span className="avatar" aria-hidden="true">
              {(user?.name ?? 'U').slice(0, 1).toUpperCase()}
            </span>
            <span>{user?.name ?? 'User'}</span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                dispatch(logout());
                navigate('/login');
              }}
            >
              Sign out
            </button>
          </div>
        </header>
        <main>
          <Outlet />
        </main>
      </div>
      <ToastRegion />
    </div>
  );
}
