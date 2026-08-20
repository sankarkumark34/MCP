import { ComponentType, SVGProps } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/authSlice';
import { ToastRegion } from '../common/Toasts';
import {
  IconCalendar,
  IconChat,
  IconClock,
  IconDashboard,
  IconLogout,
  IconMessage,
  IconSettings,
  IconUsers,
} from '../common/Icons';

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: IconDashboard },
  { to: '/schedules', label: 'Schedules', icon: IconCalendar },
  { to: '/groups', label: 'Recipients', icon: IconUsers },
  { to: '/messages', label: 'Messages', icon: IconMessage },
  { to: '/history', label: 'History', icon: IconClock },
  { to: '/settings', label: 'Settings', icon: IconSettings },
];

export function AppShell() {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="logo">
            <IconChat size={18} />
          </span>
          <span className="brand-text">WhatsApp Automation</span>
        </div>
        <nav aria-label="Main navigation">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <Icon size={18} />
              <span className="nav-label">{label}</span>
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
            <span className="user-name">{user?.name ?? 'User'}</span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                dispatch(logout());
                navigate('/login');
              }}
            >
              <IconLogout size={14} />
              <span className="signout-label">Sign out</span>
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
