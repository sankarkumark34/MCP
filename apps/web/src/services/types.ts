export interface UserInfo {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface LoginResponse {
  accessToken: string;
  user: UserInfo;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  supported: boolean;
}

export interface Contact {
  id: string;
  listId: string;
  name: string;
  phone: string;
  createdAt: string;
}

export interface GroupDetails extends Group {
  members: Contact[];
}

export type Frequency = 'daily' | 'weekdays' | 'weekends' | 'weekly';

export interface ScheduleTiming {
  frequency: Frequency;
  time: string;
  timezone: string;
  weekday?: number;
}

export interface Schedule {
  id: string;
  name: string;
  targetGroupId: string;
  groupName: string | null;
  message: string;
  frequency: Frequency;
  time: string;
  timezone: string;
  weekday: number | null;
  enabled: boolean;
  nextRunAt: string | null;
  summary: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleInput {
  name: string;
  targetGroupId: string;
  message: string;
  schedule: ScheduleTiming;
  enabled: boolean;
}

export interface Template {
  id: string;
  name: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export type ExecutionStatus = 'PENDING' | 'SENT' | 'FAILED' | 'RETRIED' | 'SKIPPED';

export interface Execution {
  id: string;
  scheduleId: string;
  scheduleName?: string;
  idempotencyKey: string;
  scheduledAt: string;
  status: ExecutionStatus;
  attemptCount: number;
  providerMessageId: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  durationMs: number | null;
  isTest: boolean;
  createdAt: string;
}

export interface HistoryResponse {
  total: number;
  items: Execution[];
}

export interface DashboardOverview {
  kpis: {
    activeAutomations: number;
    totalAutomations: number;
    messagesSent: number;
    messagesFailed: number;
    nextRunAt: string | null;
    nextRunName: string | null;
    nextRunTimezone: string | null;
  };
  deliveryTrend: { date: string; sent: number; failed: number }[];
  activeAutomations: {
    id: string;
    name: string;
    enabled: boolean;
    summary: string;
    nextRunAt: string;
  }[];
  recentActivity: Execution[];
}

export interface ProviderStatus {
  connected: boolean;
  provider: string;
  groupMessagingSupported: boolean;
  detail: string;
}
