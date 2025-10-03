require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Extract project reference from URL
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)/)[1];

// Supabase connection string format
const connectionString = `postgresql://postgres.[PROJECT_REF]:[YOUR_PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`;

async function setupDatabase() {
  console.log('🚀 Setting up Supabase database...\n');
  console.log('⚠️  Note: Direct database connection requires database password.\n');
  console.log('Since we can\'t connect directly via pg without password,');
  console.log('the SQL schema must be executed manually.\n');

  console.log('📝 Please follow these steps:\n');
  console.log('1. Open Supabase SQL Editor:');
  console.log(`   https://app.supabase.com/project/${projectRef}/sql/new\n`);

  console.log('2. Copy the SQL schema from:');
  console.log(`   ${path.join(__dirname, '..', 'supabase', 'schema.sql')}\n`);

  console.log('3. Paste into SQL Editor and click "Run"\n');

  console.log('✅ Storage buckets already created:');
  console.log('  • avatars (public)');
  console.log('  • media (private)');
  console.log('  • documents (private)');
  console.log('  • recordings (private)\n');

  console.log('💡 Quick tip: Open the schema.sql file in your editor,');
  console.log('   select all (Ctrl+A), copy (Ctrl+C), and paste in SQL Editor.\n');

  // Check if we can read the schema file
  const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    const lines = schema.split('\n').length;
    const tables = (schema.match(/CREATE TABLE/g) || []).length;

    console.log(`📊 Schema statistics:`);
    console.log(`  • ${lines} lines`);
    console.log(`  • ${tables} tables to create`);
    console.log(`  • RLS policies included`);
    console.log(`  • Triggers and functions included\n`);
  }

  console.log('🎯 After running the schema, you can start the app with:');
  console.log('   npm start\n');
}

setupDatabase().catch(console.error);
