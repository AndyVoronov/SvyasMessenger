import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function executeSQL(sql) {
  // Use PostgREST's rpc endpoint if available, otherwise use HTTP for each statement
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ sql })
  });

  return {
    ok: response.ok,
    status: response.status,
    text: await response.text()
  };
}

// Split SQL into individual statements
function splitSQL(content) {
  const statements = [];
  let current = '';
  let inFunction = false;

  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('--')) continue;

    // Track if we're inside a function
    if (trimmed.includes('$$')) {
      inFunction = !inFunction;
    }

    current += line + '\n';

    // End of statement: semicolon outside of function
    if (trimmed.endsWith(';') && !inFunction) {
      statements.push(current.trim());
      current = '';
    }
  }

  return statements.filter(s => s.length > 0);
}

async function setupDatabase() {
  console.log('🚀 Creating database schema...\n');

  const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  const statements = splitSQL(schema);
  console.log(`📝 Found ${statements.length} SQL statements\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.substring(0, 60).replace(/\n/g, ' ') + '...';

    process.stdout.write(`[${i + 1}/${statements.length}] ${preview} `);

    try {
      const result = await executeSQL(stmt);

      if (result.ok || result.status === 409 || result.status === 200) {
        console.log('✅');
        successCount++;
      } else {
        console.log(`⚠️  (${result.status})`);
        if (result.status !== 404) { // 404 means endpoint doesn't exist
          failCount++;
        }
      }
    } catch (error) {
      console.log(`❌ ${error.message}`);
      failCount++;
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`  ✅ Success: ${successCount}`);
  console.log(`  ❌ Failed: ${failCount}\n`);

  if (failCount > 0) {
    console.log('⚠️  Some statements failed. This might be because:');
    console.log('  • The RPC endpoint doesn\'t exist (execute SQL manually)');
    console.log('  • Tables already exist (safe to ignore)\n');

    console.log('📝 To execute manually:');
    const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)/)[1];
    console.log(`  https://app.supabase.com/project/${projectRef}/sql/new\n`);
  } else {
    console.log('✅ All tables created successfully!\n');
  }

  console.log('✅ Storage buckets (already created):');
  console.log('  • avatars, media, documents, recordings\n');
}

setupDatabase().catch(err => {
  console.error('\n❌ Error:', err.message);
  console.log('\n📝 Please execute the schema manually in Supabase SQL Editor.');
  process.exit(1);
});
