import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://srojzczuobafgepaynjo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyb2p6Y3p1b2JhZmdlcGF5bmpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0NzgwNDgsImV4cCI6MjA3NTA1NDA0OH0.22HyULiQDJAfLC5wJdk0UJ0FPVgYZxsKKYqtjK_znoo';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database tables
export const TABLES = {
  USERS: 'users',
  PROFILES: 'profiles',
  CHATS: 'chats',
  CHAT_PARTICIPANTS: 'chat_participants',
  MESSAGES: 'messages',
  MESSAGE_REACTIONS: 'message_reactions',
  CALLS: 'calls',
  CALL_PARTICIPANTS: 'call_participants',
  NOTIFICATIONS: 'notifications',
} as const;

// Storage buckets
export const BUCKETS = {
  AVATARS: 'avatars',
  MEDIA: 'media',
  DOCUMENTS: 'documents',
  RECORDINGS: 'recordings',
} as const;
