# Migration Impact Assessment Protocol

**MOB-113** — Every database migration must pass this checklist before deployment.

## Naming Convention

Migrations use the 14-digit timestamp format: `YYYYMMDDHHMMSS_description.sql`

## 5-Point Migration Impact Checklist

### 1. Consumer Search
Search the entire codebase for all consumers of the affected database object (table, RPC, view, trigger):
```bash
grep -r "object_name" src/ --include="*.ts" --include="*.tsx"
```

### 2. Return Schema Verification
Verify the migration's return schema matches all frontend TypeScript interfaces. If an RPC returns columns, every consumer's type definition must align.

### 3. No Breaking Renames/Removals
Never rename or remove columns without updating all UI consumers first. Prefer additive changes (new columns with defaults) over destructive ones.

### 4. Build Verification
Run `npm run build` immediately after applying the migration. Fix any type errors before merging.

### 5. Dependency Documentation
Add a header comment in the migration listing all known consumers:
```sql
-- Consumers: src/hooks/useMyHook.ts, src/components/MyComponent.tsx
-- Impact: Adds new column with default, no breaking changes
```

## RPC-Specific Guidelines

- Always `DROP FUNCTION IF EXISTS` before `CREATE` to avoid signature conflicts.
- Use `SECURITY DEFINER` with `SET search_path = public` for functions that cross schema boundaries (e.g., joining `auth.users`).
- Grant execute permissions explicitly: `GRANT EXECUTE ON FUNCTION ... TO authenticated;`

## RLS Policy Guidelines

- Use `SECURITY DEFINER` helper functions (e.g., `is_admin()`) to prevent infinite recursion.
- Never query the same table a policy protects without a security definer wrapper.

## Rollback Strategy

For every migration, consider: can this be reversed? Document rollback SQL in comments if the change is destructive.
