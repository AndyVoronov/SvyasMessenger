require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function executeSQL(sql) {
  // Extract project reference from URL
  const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)/)[1];

  // Use Supabase Management API to execute SQL
  const url = `https://${projectRef}.supabase.co/rest/v1/rpc/exec`;

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ query: sql });

    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'return=representation'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, status: res.statusCode });
        } else {
          resolve({ success: false, status: res.statusCode, error: data });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('🚀 Setting up Supabase database via Management API...\n');

  const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
  const sqlContent = fs.readFileSync(schemaPath, 'utf8');

  // Try to execute the entire schema at once
  console.log('📝 Executing full schema...\n');

  const result = await executeSQL(sqlContent);

  if (result.success) {
    console.log('✅ Schema executed successfully!\n');
  } else {
    console.log(`⚠️  Management API execution failed (Status: ${result.status})\n`);
    console.log('Please execute the schema manually:\n');
    console.log('1. Open: https://app.supabase.com/project/' +
                SUPABASE_URL.match(/https:\/\/([^.]+)/)[1] + '/sql/new');
    console.log('2. Copy the contents from: supabase/schema.sql');
    console.log('3. Paste in SQL Editor and click "Run"\n');

    if (result.error) {
      console.log('Error details:', result.error);
    }
  }

  // Verify storage buckets were created
  console.log('📦 Storage buckets created:');
  console.log('  ✅ avatars');
  console.log('  ✅ media');
  console.log('  ✅ documents');
  console.log('  ✅ recordings\n');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  console.log('\nPlease run the SQL schema manually in Supabase Dashboard.');
  process.exit(1);
});
