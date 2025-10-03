require('dotenv').config();
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const projectRef = SUPABASE_URL ? SUPABASE_URL.match(/https:\/\/([^.]+)/)?.[1] : null;

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║        Supabase Database Setup Instructions                ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log('✅ Storage buckets created successfully:');
console.log('  📦 avatars (public) - for user avatars');
console.log('  📦 media (private) - for photos & videos');
console.log('  📦 documents (private) - for documents');
console.log('  📦 recordings (private) - for call recordings\n');

console.log('📝 Next step: Create database tables\n');
console.log('   Since Supabase doesn\'t allow SQL execution via API,');
console.log('   please execute the schema manually:\n');

if (projectRef) {
  console.log('1️⃣  Open SQL Editor:');
  console.log(`   🔗 https://app.supabase.com/project/${projectRef}/sql/new\n`);
} else {
  console.log('1️⃣  Go to: Supabase Dashboard → SQL Editor → New Query\n');
}

console.log('2️⃣  Open schema file in your editor:');
const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
console.log(`   📄 ${schemaPath}\n`);

console.log('3️⃣  Copy all content (Ctrl+A, Ctrl+C)\n');

console.log('4️⃣  Paste in Supabase SQL Editor and click "Run" (or F5)\n');

// Read schema stats
if (fs.existsSync(schemaPath)) {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  const tables = (schema.match(/CREATE TABLE/g) || []).length;
  const policies = (schema.match(/CREATE POLICY/g) || []).length;
  const functions = (schema.match(/CREATE.*FUNCTION/g) || []).length;
  const triggers = (schema.match(/CREATE TRIGGER/g) || []).length;

  console.log('📊 Schema Overview:');
  console.log(`   • ${tables} tables`);
  console.log(`   • ${policies} RLS policies`);
  console.log(`   • ${functions} functions`);
  console.log(`   • ${triggers} triggers\n`);
}

console.log('⚠️  Important: If you see an error about snippets,');
console.log('   just close the tab and create a new query.\n');

console.log('✅ After schema is created, verify in:');
console.log('   • Table Editor (check all tables exist)');
console.log('   • Storage (check all buckets)\n');

console.log('🚀 Then start your app with:');
console.log('   npm start\n');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
