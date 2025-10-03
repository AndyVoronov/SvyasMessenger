# Svyas Messenger

Кроссплатформенный мобильный мессенджер на React Native с поддержкой текстовых сообщений, файлов, голосовых и видеозвонков.

## Технологии

- **Frontend**: React Native 0.81.4, TypeScript
- **State Management**: Redux Toolkit
- **Navigation**: React Navigation
- **Backend**: Supabase (PostgreSQL, Authentication, Storage, Realtime)
- **WebRTC**: React Native WebRTC для звонков
- **Real-time**: Socket.io, Supabase Realtime

## Требования

- Node.js >= 20
- npm или yarn
- React Native CLI
- Android Studio (для Android)
- Xcode (для iOS, только macOS)

## Установка

1. Клонируйте репозиторий:
```bash
git clone <repository-url>
cd SvyasMessenger
```

2. Установите зависимости:
```bash
npm install
```

3. Настройте переменные окружения:
```bash
cp .env.example .env
```

Заполните `.env` своими данными Supabase и Firebase.

4. Настройте Supabase:
   - Создайте проект на [supabase.com](https://supabase.com)
   - Выполните SQL-скрипт из `supabase/schema.sql` в SQL Editor
   - Настройте Storage buckets: avatars, media, documents, recordings
   - Скопируйте URL и Anon Key в `.env`

## Запуск

### Android
```bash
npm run android
```

### iOS
```bash
cd ios && pod install && cd ..
npm run ios
```

### Metro Bundler
```bash
npm start
```

## Скрипты

- `npm start` - запуск Metro bundler
- `npm run android` - запуск на Android
- `npm run ios` - запуск на iOS
- `npm test` - запуск тестов
- `npm run lint` - проверка кода

## Структура проекта

```
src/
├── modules/           # Модули приложения
│   ├── auth/         # Аутентификация
│   ├── profile/      # Профиль пользователя
│   ├── chat/         # Чаты и сообщения
│   ├── calls/        # Звонки
│   ├── notifications/# Уведомления
│   └── settings/     # Настройки
├── navigation/       # Навигация
├── store/           # Redux store и slices
├── services/        # Сервисы (Supabase, API)
├── utils/           # Утилиты
├── types/           # TypeScript типы
├── components/      # Переиспользуемые компоненты
└── assets/          # Изображения, шрифты
```

## Основные функции

### Аутентификация
- Регистрация и вход по email/пароль
- OAuth (Google/Apple ID)
- Восстановление пароля
- Биометрическая аутентификация

### Чаты
- Индивидуальные и групповые чаты (до 100 участников)
- Текстовые сообщения, файлы, голосовые сообщения
- Редактирование/удаление сообщений (15 мин)
- Реакции на сообщения
- End-to-end шифрование

### Звонки
- Голосовые и видеозвонки
- Групповые звонки (до 8 участников)
- Запись звонков с согласием

### Профиль
- Редактирование имени, аватара, статуса
- Настройки конфиденциальности
- Двухфакторная аутентификация

### Настройки
- Выбор языка (русский/английский)
- Тема (светлая/темная/системная)
- Настройки уведомлений
- Параметры безопасности

## База данных

Схема базы данных находится в `supabase/schema.sql`. Основные таблицы:

- `users` - пользователи
- `profiles` - профили пользователей
- `chats` - чаты
- `messages` - сообщения
- `calls` - звонки
- `notifications` - уведомления

Все таблицы защищены Row Level Security (RLS).

## Безопасность

- End-to-end шифрование сообщений (Signal Protocol)
- HTTPS для всех API-запросов
- JWT токены для аутентификации
- Row Level Security в Supabase
- Rate limiting (100 запросов/мин на пользователя)
- Соответствие GDPR/CCPA

## Тестирование

```bash
# Unit тесты
npm test

# E2E тесты (Detox)
npm run test:e2e:ios
npm run test:e2e:android
```

## Развертывание

### Android
1. Сгенерируйте подписанный APK/AAB
2. Загрузите в Google Play Console

### iOS
1. Настройте signing в Xcode
2. Создайте archive
3. Загрузите в App Store Connect

## Дополнительная документация

- [CLAUDE.md](CLAUDE.md) - инструкции для Claude Code
- [TechnicalSpecification.md](TechnicalSpecification.md) - полное техническое задание

## Лицензия

Proprietary - все права защищены

## Контакты

Для вопросов и поддержки: support@svyas.com
