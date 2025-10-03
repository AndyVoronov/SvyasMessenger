require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUser() {
  console.log('🔧 Создание тестового пользователя...\n');

  const email = 'test@example.com';
  const password = 'password123';

  try {
    // Создаём пользователя через Admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Автоматически подтверждаем email
    });

    if (error) {
      if (error.message.includes('already registered')) {
        console.log('✅ Пользователь уже существует');
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Пароль: ${password}\n`);
        return;
      }
      throw error;
    }

    console.log('✅ Тестовый пользователь создан успешно!');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Пароль: ${password}`);
    console.log(`🆔 User ID: ${data.user.id}\n`);

    console.log('Теперь вы можете войти в приложение с этими данными!');
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

createTestUser();
