
import { supabase } from './types.config';

export { supabase };

// Set up listeners for schema changes
supabase.realtime
  .channel('schema-db-changes')
  .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
    console.log('Schema change detected:', payload);
    // In development, you might want to notify developers to run type generation
    if (import.meta.env.DEV) {
      console.warn('⚠️ Database schema changed. Please run `npm run generate-types` to update TypeScript definitions.');
    }
  })
  .subscribe();

