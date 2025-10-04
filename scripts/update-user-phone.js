require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateUserPhone() {
  const email = process.argv[2];
  const phone = process.argv[3];

  if (!email || !phone) {
    console.error('Usage: node update-user-phone.js <email> <phone>');
    console.error('Example: node update-user-phone.js user@example.com +79991234567');
    process.exit(1);
  }

  try {
    // Находим пользователя по email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (userError) {
      console.error('Error finding user:', userError);
      process.exit(1);
    }

    if (!userData) {
      console.error('User not found');
      process.exit(1);
    }

    console.log('Found user:', userData.id);

    // Обновляем телефон в профиле
    const { data, error } = await supabase
      .from('profiles')
      .update({ phone })
      .eq('id', userData.id)
      .select();

    if (error) {
      console.error('Error updating phone:', error);
      process.exit(1);
    }

    console.log('✅ Phone updated successfully!');
    console.log('User ID:', userData.id);
    console.log('Email:', email);
    console.log('Phone:', phone);

  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

updateUserPhone();
