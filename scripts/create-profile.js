require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createProfile() {
  const email = 'andrei_94@list.ru';
  const phone = '+79260660936';

  try {
    // Находим пользователя
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (userError || !userData) {
      console.error('User not found:', userError);
      process.exit(1);
    }

    console.log('User ID:', userData.id);

    // Создаем профиль
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userData.id,
        phone: phone,
        name: email.split('@')[0]
      })
      .select();

    if (profileError) {
      console.error('Error creating profile:', profileError);
      process.exit(1);
    }

    console.log('✅ Profile created successfully!');
    console.log(profileData);

  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

createProfile();
