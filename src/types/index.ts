// User and Profile Types
export interface User {
  id: string;
  email: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: string;
  userId: string;
  name: string;
  avatar?: string;
  status?: string;
  lastOnline?: string;
  privacySettings: PrivacySettings;
}

export interface PrivacySettings {
  onlineVisibility: 'everyone' | 'contacts' | 'nobody';
  profilePhotoVisibility: 'everyone' | 'contacts' | 'nobody';
  statusVisibility: 'everyone' | 'contacts' | 'nobody';
}

// Chat Types
export interface Chat {
  id: string;
  type: 'individual' | 'group';
  name?: string; // For group chats
  avatar?: string;
  participants: string[]; // User IDs
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastMessage?: Message;
  unreadCount: number;
  isArchived: boolean;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  type: 'text' | 'image' | 'video' | 'document' | 'voice' | 'system';
  content: string;
  mediaUrl?: string;
  mediaSize?: number;
  quotedMessageId?: string;
  reactions?: MessageReaction[];
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  deliveredTo: string[];
  readBy: string[];
}

export interface MessageReaction {
  userId: string;
  emoji: string;
  createdAt: string;
}

// Call Types
export interface Call {
  id: string;
  type: 'voice' | 'video';
  chatId: string;
  initiatorId: string;
  participants: CallParticipant[];
  status: 'ringing' | 'active' | 'ended' | 'missed';
  startedAt?: string;
  endedAt?: string;
  duration?: number;
  isRecorded: boolean;
  recordingUrl?: string;
}

export interface CallParticipant {
  userId: string;
  joinedAt?: string;
  leftAt?: string;
  isMuted: boolean;
  isVideoEnabled: boolean;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: 'message' | 'call' | 'mention' | 'system';
  title: string;
  body: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

// Settings Types
export interface AppSettings {
  language: 'ru' | 'en';
  theme: 'light' | 'dark' | 'system';
  autoDownloadMedia: {
    photos: boolean;
    videos: boolean;
    documents: boolean;
  };
  notifications: NotificationSettings;
  security: SecuritySettings;
}

export interface NotificationSettings {
  enabled: boolean;
  messages: boolean;
  calls: boolean;
  mentions: boolean;
  mutedChats: string[]; // Chat IDs
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  biometricEnabled: boolean;
  pinLockEnabled: boolean;
  pinCode?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Chat: { chatId: string };
  Profile: { userId: string };
  Settings: undefined;
  Call: { callId: string };
};

export type MainTabParamList = {
  Chats: undefined;
  Calls: undefined;
  Settings: undefined;
  UserProfile: undefined;
};
