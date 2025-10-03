import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import profileReducer from './slices/profileSlice';
import chatsReducer from './slices/chatsSlice';
import messagesReducer from './slices/messagesSlice';
import callsReducer from './slices/callsSlice';
import settingsReducer from './slices/settingsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
    chats: chatsReducer,
    messages: messagesReducer,
    calls: callsReducer,
    settings: settingsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['auth/setSession'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.session'],
        // Ignore these paths in the state
        ignoredPaths: ['auth.session'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
