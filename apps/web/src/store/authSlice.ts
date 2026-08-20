import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { UserInfo } from '../services/types';

interface AuthState {
  token: string | null;
  user: UserInfo | null;
}

const STORAGE_KEY = 'wa-automation-auth';

function loadInitial(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AuthState;
  } catch {
    // ignore corrupt storage
  }
  return { token: null, user: null };
}

const authSlice = createSlice({
  name: 'auth',
  initialState: loadInitial(),
  reducers: {
    setCredentials(state, action: PayloadAction<{ token: string; user: UserInfo }>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    },
    logout(state) {
      state.token = null;
      state.user = null;
      localStorage.removeItem(STORAGE_KEY);
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
