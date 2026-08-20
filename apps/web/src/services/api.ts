import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../store/store';
import type {
  DashboardOverview,
  Execution,
  Group,
  HistoryResponse,
  LoginResponse,
  ProviderStatus,
  Schedule,
  ScheduleInput,
  Template,
} from './types';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api/v1',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Dashboard', 'Schedules', 'Groups', 'Templates', 'History'],
  endpoints: (build) => ({
    login: build.mutation<LoginResponse, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),

    getDashboard: build.query<DashboardOverview, void>({
      query: () => '/dashboard',
      providesTags: ['Dashboard'],
    }),

    getGroups: build.query<Group[], void>({
      query: () => '/groups',
      providesTags: ['Groups'],
    }),

    getSchedules: build.query<Schedule[], void>({
      query: () => '/schedules',
      providesTags: ['Schedules'],
    }),
    getSchedule: build.query<Schedule, string>({
      query: (id) => `/schedules/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Schedules', id }],
    }),
    createSchedule: build.mutation<Schedule, ScheduleInput>({
      query: (body) => ({ url: '/schedules', method: 'POST', body }),
      invalidatesTags: ['Schedules', 'Dashboard'],
    }),
    updateSchedule: build.mutation<Schedule, { id: string } & Partial<ScheduleInput>>({
      query: ({ id, ...body }) => ({ url: `/schedules/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => ['Schedules', 'Dashboard', { type: 'Schedules', id }],
    }),
    deleteSchedule: build.mutation<{ deleted: true }, string>({
      query: (id) => ({ url: `/schedules/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Schedules', 'Dashboard'],
    }),
    pauseSchedule: build.mutation<Schedule, string>({
      query: (id) => ({ url: `/schedules/${id}/pause`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => ['Schedules', 'Dashboard', { type: 'Schedules', id }],
    }),
    resumeSchedule: build.mutation<Schedule, string>({
      query: (id) => ({ url: `/schedules/${id}/resume`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => ['Schedules', 'Dashboard', { type: 'Schedules', id }],
    }),
    sendTest: build.mutation<Execution, string>({
      query: (id) => ({ url: `/schedules/${id}/test`, method: 'POST' }),
      invalidatesTags: ['History', 'Dashboard'],
    }),

    getTemplates: build.query<Template[], void>({
      query: () => '/templates',
      providesTags: ['Templates'],
    }),
    createTemplate: build.mutation<Template, { name: string; body: string }>({
      query: (body) => ({ url: '/templates', method: 'POST', body }),
      invalidatesTags: ['Templates'],
    }),
    updateTemplate: build.mutation<Template, { id: string; name?: string; body?: string }>({
      query: ({ id, ...body }) => ({ url: `/templates/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Templates'],
    }),
    deleteTemplate: build.mutation<{ deleted: true }, string>({
      query: (id) => ({ url: `/templates/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Templates'],
    }),

    getHistory: build.query<
      HistoryResponse,
      { scheduleId?: string; status?: string; limit?: number; offset?: number }
    >({
      query: (params) => ({ url: '/history', params }),
      providesTags: ['History'],
    }),

    getProviderStatus: build.query<ProviderStatus, void>({
      query: () => '/provider/status',
    }),
    getAiStatus: build.query<{ enabled: boolean }, void>({
      query: () => '/ai/status',
    }),
    composeAi: build.mutation<{ message: string }, { prompt: string; tone?: string }>({
      query: (body) => ({ url: '/ai/compose', method: 'POST', body }),
    }),
  }),
});

export const {
  useLoginMutation,
  useGetDashboardQuery,
  useGetGroupsQuery,
  useGetSchedulesQuery,
  useGetScheduleQuery,
  useCreateScheduleMutation,
  useUpdateScheduleMutation,
  useDeleteScheduleMutation,
  usePauseScheduleMutation,
  useResumeScheduleMutation,
  useSendTestMutation,
  useGetTemplatesQuery,
  useCreateTemplateMutation,
  useUpdateTemplateMutation,
  useDeleteTemplateMutation,
  useGetHistoryQuery,
  useGetProviderStatusQuery,
  useGetAiStatusQuery,
  useComposeAiMutation,
} = api;
