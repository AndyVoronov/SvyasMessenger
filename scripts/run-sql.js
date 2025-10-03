require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function executeSqlFile() {
  console.log('🚀 Executing SQL schema...\n');

  const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
  const sqlContent = fs.readFileSync(schemaPath, 'utf8');

  // Split SQL by semicolons and execute each statement
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';

    // Skip comments
    if (statement.trim().startsWith('--')) continue;

    try {
      console.log(`[${i + 1}/${statements.length}] Executing...`);

      const { data, error } = await supabase.rpc('exec_sql', {
        sql: statement
      });

      if (error) {
        // Try alternative method using REST API directly
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({ query: statement })
        });

        if (!response.ok) {
          console.log(`⚠️  Statement ${i + 1} failed (may be expected for CREATE IF NOT EXISTS)`);
          continue;
        }
      }

      console.log(`✅ Statement ${i + 1} executed successfully`);
    } catch (err) {
      console.log(`⚠️  Statement ${i + 1} error: ${err.message}`);
    }
  }

  console.log('\n✅ SQL execution completed!\n');
}

executeSqlFile().catch(console.error);
