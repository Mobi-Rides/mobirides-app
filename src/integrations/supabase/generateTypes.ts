
import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

const generateTypes = () => {
  try {
    console.log('🔄 Generating Supabase types...');
    
    // Run Supabase type generation
    execSync('npx supabase gen types typescript --project-id your-project-id > src/integrations/supabase/types.ts', {
      stdio: 'inherit',
    });

    console.log('✅ Types generated successfully!');
  } catch (error) {
    console.error('❌ Error generating types:', error);
    process.exit(1);
  }
};

// Run the type generation
generateTypes();

