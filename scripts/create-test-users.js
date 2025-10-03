require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createTestUsers() {
  console.log('🔧 Создание тестовых пользователей...\n');

  const users = [
    { email: 'user1@example.com', password: 'password123', name: 'Пользователь 1' },
    { email: 'user2@example.com', password: 'password123', name: 'Пользователь 2' },
  ];

  for (const user of users) {
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: { name: user.name }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          console.log(`✅ ${user.email} - уже существует`);
        } else {
          throw error;
        }
      } else {
        console.log(`✅ ${user.email} - создан (ID: ${data.user.id})`);
      }
    } catch (err) {
      console.error(`❌ Ошибка создания ${user.email}:`, err.message);
    }
  }

  console.log('\n📋 Тестовые аккаунты:');
  console.log('1. user1@example.com / password123');
  console.log('2. user2@example.com / password123');
  console.log('\nТеперь можно протестировать чаты между пользователями!');
}

createTestUsers();
