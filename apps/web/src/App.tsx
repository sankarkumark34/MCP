import { Navigate, Route, Routes } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAppSelector } from './store/hooks';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { SchedulesPage } from './pages/SchedulesPage';
import { ScheduleFormPage } from './pages/ScheduleFormPage';
import { GroupsPage } from './pages/GroupsPage';
import { MessagesPage } from './pages/MessagesPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';

function RequireAuth({ children }: { children: ReactNode }) {
  const token = useAppSelector((s) => s.auth.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/schedules" element={<SchedulesPage />} />
        <Route path="/schedules/new" element={<ScheduleFormPage />} />
        <Route path="/schedules/:id" element={<ScheduleFormPage />} />
        <Route path="/groups" element={<GroupsPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
