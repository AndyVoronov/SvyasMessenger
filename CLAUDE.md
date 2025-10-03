# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cross-platform mobile messenger application built with React Native, Supabase backend, and TypeScript. The app supports text messaging, file sharing, voice/video calls with end-to-end encryption. Target platforms: iOS 14.0+ and Android 10.0+.

**Primary Language**: Russian (with English support planned)

## Technology Stack

### Frontend
- **Framework**: React Native 0.73+
- **Language**: TypeScript
- **State Management**: Redux or MobX
- **Navigation**: React Navigation
- **Real-time**: Socket.io-client
- **WebRTC**: React Native WebRTC for voice/video calls
- **Deployment**: Vercel for PWA web version; App Store/Google Play for mobile

### Backend
- **BaaS**: Supabase (authentication, real-time, storage)
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Functions**: TypeScript Edge Functions in Supabase
- **Real-time**: Supabase Realtime for chat/notifications
- **Push Notifications**: Firebase Cloud Messaging

### Security & Encryption
- **E2E Encryption**: Signal Protocol using libsignal library
- **Authentication**: JWT tokens, OAuth (Google/Apple ID)
- **Data Protection**: HTTPS, RLS policies, rate limiting (100 req/min/user)
- **Compliance**: GDPR/CCPA

## Core Architecture

### Module Structure
1. **Authentication & Profile Module**
   - Email/password registration with OTP verification
   - OAuth integration (Google/Apple)
   - Biometric auth (Face ID/Touch ID)
   - Profile management (avatar, name, status, phone)
   - Privacy settings (online visibility)

2. **Chat & Messaging Module**
   - Individual and group chats (up to 100 participants)
   - Message types: text (2000 chars), emoji, files (photos/videos 50MB, docs 100MB), voice (5 min)
   - Real-time delivery via Supabase Realtime
   - Message editing/deletion (15 min window), quotes, reactions
   - End-to-end encryption for all messages

3. **Voice & Video Calls Module**
   - Individual and group calls (up to 8 participants)
   - WebRTC with STUN/TURN servers
   - Adaptive quality (360p-1080p)
   - Call recording with consent (stored in Supabase Storage)
   - Screen sharing (individual calls only)

4. **Additional Features**
   - Global search (users, chats, messages)
   - Push notifications with granular settings
   - 2FA, PIN lock, theme support (light/dark/system)

### Data Flow
- **Chat Flow**: User sends message → encrypted with Signal Protocol → stored in PostgreSQL → delivered via Supabase Realtime → decrypted on recipient device
- **Call Flow**: Initiate call via Socket.io → establish P2P WebRTC → fallback to TURN relay if P2P fails
- **Offline Support**: Local caching with Realm/SQLite, messages queued for delivery

## Development Commands

### Running the app
```bash
# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS (macOS only)
cd ios && pod install && cd ..
npm run ios
```

### Development
```bash
# Install dependencies
npm install

# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Clear cache
npx react-native start --reset-cache
```

### Testing
```bash
# Unit tests
npm test

# Test with coverage
npm test -- --coverage

# E2E tests (Detox)
npm run test:e2e:ios
npm run test:e2e:android
```

### Database (Supabase)
- Execute `supabase/schema.sql` in Supabase SQL Editor
- Create Storage buckets: avatars, media, documents, recordings
- Configure RLS policies are already included in schema.sql

### CI/CD
- **Pipeline**: GitHub Actions (`.github/workflows/ci.yml`)
- Runs on push to main/develop branches
- Automated linting, testing, and building

## Performance Requirements
- Message send response: <200ms
- Chat list load: <500ms (for 100 chats)
- Concurrent connections: 10,000 without degradation
- Target scale: 1M active users

## Key Constraints
- Message text limit: 2000 characters
- Status text: 100 characters
- Avatar size: 5MB (JPG/PNG)
- File limits: 50MB (media), 100MB (documents)
- Voice messages: 5 minutes max
- Group chat participants: 100 max
- Group call participants: 8 max
- Message edit/delete window: 15 minutes

## UI/UX Guidelines
- Material Design for Android, Cupertino for iOS
- Accessibility: WCAG 2.1 AA compliance, screen reader support
- Gestures: swipe to delete, pull-to-refresh
- Bottom Tab Bar navigation: Chats/Calls/Settings/Profile

## Project Configuration

### Supabase Connection
- URL: `https://xqijgdbxjolgdujeplyi.supabase.co`
- Already configured in `src/services/supabase.ts`
- Database schema in `supabase/schema.sql`

### Current Implementation Status
✅ **Completed:**
- Project structure and folders
- Redux store with all slices (auth, profile, chats, messages, calls, settings)
- Navigation (Auth, Main with bottom tabs)
- Authentication screens (Login, Register, ForgotPassword)
- Main app screens (Chats, Calls, Profile, Settings)
- Supabase integration with RLS policies
- WebRTC service for calls
- Socket.io service for real-time communication
- TypeScript types for all entities
- CI/CD with GitHub Actions

🚧 **In Progress:**
- Voice/video calls implementation
- Push notifications with Firebase
- E2E encryption with Signal Protocol
- File upload/download functionality

📋 **Not Started:**
- OAuth integration (Google/Apple)
- Biometric authentication
- Message encryption
- Call recording
- Advanced chat features (reactions, quotes)

## Important Notes

- All database operations require proper RLS policies
- Messages should be encrypted before storing (not yet implemented)
- WebRTC requires STUN/TURN server configuration
- Socket.io events defined in `src/services/socket.ts`
- All screens use Redux hooks: `useAppSelector`, `useAppDispatch`