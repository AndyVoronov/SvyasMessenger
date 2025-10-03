import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppSettings } from '../../types';

const initialState: AppSettings = {
  language: 'ru',
  theme: 'system',
  autoDownloadMedia: {
    photos: true,
    videos: false,
    documents: false,
  },
  notifications: {
    enabled: true,
    messages: true,
    calls: true,
    mentions: true,
    mutedChats: [],
  },
  security: {
    twoFactorEnabled: false,
    biometricEnabled: false,
    pinLockEnabled: false,
  },
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<'ru' | 'en'>) => {
      state.language = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },
    updateAutoDownloadMedia: (state, action: PayloadAction<Partial<AppSettings['autoDownloadMedia']>>) => {
      state.autoDownloadMedia = { ...state.autoDownloadMedia, ...action.payload };
    },
    updateNotificationSettings: (state, action: PayloadAction<Partial<AppSettings['notifications']>>) => {
      state.notifications = { ...state.notifications, ...action.payload };
    },
    updateSecuritySettings: (state, action: PayloadAction<Partial<AppSettings['security']>>) => {
      state.security = { ...state.security, ...action.payload };
    },
    muteChat: (state, action: PayloadAction<string>) => {
      if (!state.notifications.mutedChats.includes(action.payload)) {
        state.notifications.mutedChats.push(action.payload);
      }
    },
    unmuteChat: (state, action: PayloadAction<string>) => {
      state.notifications.mutedChats = state.notifications.mutedChats.filter(
        id => id !== action.payload
      );
    },
  },
});

export const {
  setLanguage,
  setTheme,
  updateAutoDownloadMedia,
  updateNotificationSettings,
  updateSecuritySettings,
  muteChat,
  unmuteChat,
} = settingsSlice.actions;

export default settingsSlice.reducer;
