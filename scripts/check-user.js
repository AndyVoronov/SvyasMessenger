require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUser() {
  const email = 'andrei_94@list.ru';

  try {
    // Проверяем users таблицу
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    console.log('=== Users table ===');
    if (userError) {
      console.error('Error:', userError);
    } else {
      console.log('User found:', userData);
    }

    if (userData) {
      // Проверяем profiles таблицу
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userData.id)
        .single();

      console.log('\n=== Profiles table ===');
      if (profileError) {
        console.error('Error:', profileError);
      } else {
        console.log('Profile found:', profileData);
      }
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkUser();
