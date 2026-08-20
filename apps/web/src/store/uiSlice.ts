import { createSlice, nanoid, PayloadAction } from '@reduxjs/toolkit';

export interface Toast {
  id: string;
  kind: 'success' | 'error' | 'info';
  title: string;
  detail?: string;
}

interface UiState {
  toasts: Toast[];
}

const uiSlice = createSlice({
  name: 'ui',
  initialState: { toasts: [] } as UiState,
  reducers: {
    pushToast: {
      reducer(state, action: PayloadAction<Toast>) {
        state.toasts.push(action.payload);
      },
      prepare(toast: Omit<Toast, 'id'>) {
        return { payload: { ...toast, id: nanoid() } };
      },
    },
    dismissToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const { pushToast, dismissToast } = uiSlice.actions;
export default uiSlice.reducer;
