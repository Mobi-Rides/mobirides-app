require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Use service role to execute SQL directly
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function applyMigrationManual() {
  try {
    console.log('Reading migration file...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', 'update_welcome_email_function.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('Migration SQL length:', migrationSQL.length);
    console.log('First 200 chars:', migrationSQL.substring(0, 200));
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log('Found', statements.length, 'SQL statements');
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`\nExecuting statement ${i + 1}:`);
      console.log(statement.substring(0, 100) + '...');
      
      try {
        const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY
          },
          body: JSON.stringify({ sql: statement })
        });
        
        if (response.ok) {
          console.log('✓ Statement executed successfully');
        } else {
          const error = await response.text();
          console.log('✗ Statement failed:', error);
        }
      } catch (error) {
        console.log('✗ Statement error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

applyMigrationManual();