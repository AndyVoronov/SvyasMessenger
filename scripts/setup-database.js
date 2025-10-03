require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file');
  process.exit(1);
}

// Read SQL schema file
const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
const sqlSchema = fs.readFileSync(schemaPath, 'utf8');

// Execute SQL via Supabase REST API
function executeSql(sql) {
  return new Promise((resolve, reject) => {
    const url = new URL('/rest/v1/rpc/exec_sql', SUPABASE_URL);
    const postData = JSON.stringify({ query: sql });

    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Alternative: Use psql direct connection
function executeViaPsql(sql) {
  const { execSync } = require('child_process');
  const dbUrl = SUPABASE_URL.replace('https://', '').split('.')[0];

  console.log('\n⚠️  Direct SQL execution via REST API not available.');
  console.log('Please execute the SQL manually in Supabase SQL Editor or use Supabase CLI:\n');
  console.log('Option 1: Supabase Dashboard');
  console.log('  1. Go to: https://app.supabase.com/project/' + dbUrl + '/sql/new');
  console.log('  2. Copy contents from: supabase/schema.sql');
  console.log('  3. Paste and click "Run"\n');
  console.log('Option 2: Supabase CLI');
  console.log('  npx supabase db push\n');
}

async function setupDatabase() {
  console.log('🚀 Setting up Supabase database...\n');

  try {
    // Try to execute SQL
    console.log('📝 Executing SQL schema...');

    // Since Supabase doesn't have a direct SQL execution endpoint without custom function,
    // we'll use curl to execute via the SQL API
    const { execSync } = require('child_process');

    const curlCommand = `curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" ` +
      `-H "apikey: ${SERVICE_ROLE_KEY}" ` +
      `-H "Authorization: Bearer ${SERVICE_ROLE_KEY}" ` +
      `-H "Content-Type: application/json" ` +
      `-d '{"query": ${JSON.stringify(sqlSchema)}}'`;

    try {
      execSync(curlCommand, { stdio: 'inherit' });
      console.log('\n✅ Database setup completed successfully!');
    } catch (error) {
      // If direct execution fails, show manual instructions
      executeViaPsql(sqlSchema);
    }

  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    executeViaPsql(sqlSchema);
  }
}

// Create storage buckets
async function createStorageBuckets() {
  console.log('\n📦 Creating Storage buckets...\n');

  const buckets = [
    { name: 'avatars', public: true },
    { name: 'media', public: false },
    { name: 'documents', public: false },
    { name: 'recordings', public: false }
  ];

  for (const bucket of buckets) {
    try {
      const url = new URL('/storage/v1/bucket', SUPABASE_URL);
      const postData = JSON.stringify({
        id: bucket.name,
        name: bucket.name,
        public: bucket.public
      });

      await new Promise((resolve, reject) => {
        const options = {
          hostname: url.hostname,
          path: url.pathname,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'Content-Length': Buffer.byteLength(postData)
          }
        };

        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            if (res.statusCode === 200 || res.statusCode === 201) {
              console.log(`✅ Created bucket: ${bucket.name}`);
              resolve();
            } else if (res.statusCode === 409) {
              console.log(`⚠️  Bucket already exists: ${bucket.name}`);
              resolve();
            } else {
              console.log(`❌ Failed to create bucket ${bucket.name}: ${data}`);
              resolve(); // Continue with other buckets
            }
          });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
      });
    } catch (error) {
      console.error(`❌ Error creating bucket ${bucket.name}:`, error.message);
    }
  }

  console.log('\n✅ Storage buckets setup completed!');
}

// Main execution
async function main() {
  await setupDatabase();
  await createStorageBuckets();

  console.log('\n🎉 Supabase setup completed!\n');
  console.log('Next steps:');
  console.log('  1. Verify tables in Supabase Dashboard → Table Editor');
  console.log('  2. Check Storage buckets in Storage section');
  console.log('  3. Run: npm start (to start the app)\n');
}

main().catch(console.error);
