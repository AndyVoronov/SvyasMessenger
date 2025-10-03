# Быстрый старт Svyas Messenger

## Шаг 1: Настройка базы данных Supabase

1. Откройте Supabase Dashboard: https://xqijgdbxjolgdujeplyi.supabase.co

2. Перейдите в **SQL Editor**

3. Скопируйте содержимое файла `supabase/schema.sql` и выполните его

4. Перейдите в **Storage** и создайте следующие buckets:
   - `avatars` (public)
   - `media` (public)
   - `documents` (private)
   - `recordings` (private)

5. Для каждого bucket настройте политики доступа:
   - Authenticated users can upload
   - Users can read their own files

## Шаг 2: Установка зависимостей

```bash
# Установите Node.js зависимости
npm install

# Для iOS (только на macOS)
cd ios
pod install
cd ..
```

## Шаг 3: Запуск приложения

### Android

1. Запустите Android эмулятор или подключите устройство

2. Запустите Metro bundler:
```bash
npm start
```

3. В новом терминале запустите Android приложение:
```bash
npm run android
```

### iOS (только macOS)

1. Запустите iOS Simulator или подключите устройство

2. Запустите Metro bundler:
```bash
npm start
```

3. В новом терминале запустите iOS приложение:
```bash
npm run ios
```

## Шаг 4: Тестирование функций

### Регистрация нового пользователя

1. На экране входа нажмите "Зарегистрироваться"
2. Введите email и пароль (минимум 8 символов, заглавная буква, цифра)
3. После регистрации вы будете автоматически войдете в приложение

### Тестовые данные

Пока в приложении нет функции создания чатов из UI, но вы можете:

1. Зарегистрировать несколько пользователей
2. Добавить тестовые данные через Supabase Dashboard:
   - Создать чаты в таблице `chats`
   - Добавить сообщения в таблицу `messages`
   - Данные автоматически отобразятся в приложении

## Распространенные проблемы

### Приложение не собирается на Android

```bash
# Очистите кэш
cd android
./gradlew clean
cd ..
npm start -- --reset-cache
```

### Ошибки TypeScript

```bash
# Проверьте типы
npx tsc --noEmit
```

### Приложение зависает на splash screen

```bash
# Перезапустите Metro bundler
npm start -- --reset-cache
```

### Ошибки подключения к Supabase

1. Проверьте, что URL и ключ правильно указаны в `src/services/supabase.ts`
2. Убедитесь, что SQL схема выполнена
3. Проверьте RLS политики в Supabase Dashboard

## Следующие шаги

После успешного запуска:

1. Изучите `PROJECT_STATUS.md` для понимания текущего состояния проекта
2. Ознакомьтесь с архитектурой в `CLAUDE.md`
3. Прочитайте полное техническое задание в `TechnicalSpecification.md`
4. Начните с реализации экрана детального чата (см. TODO в PROJECT_STATUS.md)

## Полезные команды

```bash
# Проверка линтера
npm run lint

# Запуск тестов
npm test

# Очистка и пересборка
npm start -- --reset-cache

# Проверка типов TypeScript
npx tsc --noEmit

# Просмотр логов
# Android
npx react-native log-android

# iOS
npx react-native log-ios
```

## Контакты и поддержка

При возникновении проблем:
1. Проверьте `PROJECT_STATUS.md` - возможно функция еще не реализована
2. Посмотрите в `README.md` - там есть раздел Troubleshooting
3. Проверьте логи Metro bundler и устройства

Удачи! 🚀
