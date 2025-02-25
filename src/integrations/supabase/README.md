
# Supabase Type Generation

This directory contains the configuration and scripts for automatic Supabase type generation.

## Type Generation

Types are automatically generated from your Supabase database schema. This ensures that your TypeScript types always match your database structure.

### When to Generate Types

Types should be regenerated when:
1. Database schema changes (tables, columns, etc.)
2. RLS policies are modified
3. New database functions are added

### How to Generate Types

Run the following command:
```bash
npm run generate-types
```

### Automatic Type Generation

Types are automatically generated:
- During the build process
- When running `npm run dev` (development mode)
- When database schema changes are detected

### Type Helpers

Use the type helpers in `types.config.ts`:
- `Tables<T>` - For table row types
- `Enums<T>` - For database enum types

## Best Practices

1. Always use the generated types when working with Supabase data
2. Don't modify the generated types manually
3. Keep your local types in sync by running type generation after schema changes
4. Use the type helpers to ensure type safety

