const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Minimal polyfill/loading of .env.local without external dotenv module
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function verifyStartup() {
  console.log('--- Kutlerri Workspace Startup Verification ---');

  // 1. Missing environment variables
  console.log('\\n[Environment Variables]');
  const requiredVars = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
  let missingVars = false;
  for (const v of requiredVars) {
    if (!process.env[v]) {
      console.log(`❌ Missing: ${v}`);
      missingVars = true;
    } else {
      console.log(`✅ Present: ${v}`);
    }
  }

  if (missingVars) {
    console.log('\\n🛑 Cannot connect to Supabase without required environment variables. Exiting verification.');
    process.exit(1);
  }

  // 2. Supabase connection status
  console.log('\\n[Supabase Connection]');
  const supabase = createClient(supabaseUrl, supabaseKey);
  let isConnected = false;
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (error && error.code !== '42P01') { // 42P01 is relation does not exist
      throw error;
    }
    console.log('✅ Connected to Supabase project successfully.');
    isConnected = true;
  } catch (err) {
    console.log('❌ Failed to connect to Supabase:', err.message);
  }

  if (!isConnected) {
    process.exit(1);
  }

  // 3. Missing tables
  console.log('\\n[Database Tables]');
  const requiredTables = [
    'profiles', 'organizations', 'organization_members', 'teams', 'team_members',
    'projects', 'cycles', 'milestones', 'issues', 'issue_relations', 'comments',
    'attachments', 'labels', 'issue_labels', 'notifications', 'activity_events',
    'saved_views', 'favorites', 'user_preferences'
  ];

  let missingTables = [];
  let existingTables = [];
  for (const table of requiredTables) {
    const { error } = await supabase.from(table).select('id').limit(1);
    // Code '42P01' means undefined table in Postgres
    if (error && error.code === '42P01') {
      missingTables.push(table);
    } else {
      existingTables.push(table);
    }
  }

  if (missingTables.length === 0) {
    console.log('✅ All required tables exist.');
  } else {
    console.log(`❌ Missing tables: ${missingTables.join(', ')}`);
    console.log(`✅ Existing tables: ${existingTables.join(', ')}`);
  }

  // 4. Migration status
  console.log('\\n[Migration Status]');
  const migrationsDir = path.resolve(process.cwd(), 'supabase', 'migrations');
  if (fs.existsSync(migrationsDir)) {
    const migrations = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
    console.log(`Found ${migrations.length} migration file(s) in supabase/migrations:`);
    migrations.forEach(m => console.log(` - ${m}`));
    if (missingTables.length > 0) {
      console.log('\\n⚠️ WARNING: You have missing tables. You need to apply migrations.');
      console.log('Please run the following command to link and push your database:');
      console.log('  npx supabase link --project-ref <your-project-id>');
      console.log('  npx supabase db push');
    } else {
      console.log('✅ Schema appears up-to-date.');
    }
  } else {
    console.log('❌ No supabase/migrations directory found.');
  }

  console.log('\\n--- Verification Complete ---');
}

verifyStartup().catch(err => {
  console.error('Fatal error during startup verification:', err);
  process.exit(1);
});
