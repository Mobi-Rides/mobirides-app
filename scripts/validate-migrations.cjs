#!/usr/bin/env node

/**
 * Migration Validation Script
 * Checks for common migration issues before running db reset
 */

const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations');

// Extensions that are not available in local development
const UNAVAILABLE_EXTENSIONS = [
  'pg_cron',
  'pg_net'
];

// System schemas that exist by default (not created in migrations)
const SYSTEM_SCHEMAS = ['auth', 'storage', 'pg_catalog', 'information_schema', 'extensions'];

// SQL keywords that should be filtered out from extracted "table names"
const SQL_KEYWORDS = [
  'CREATE', 'DROP', 'ALTER', 'FOR', 'AFTER', 'BEFORE', 'ENABLE', 'IN', 'ONLY', 
  'TABLE', 'EXISTS', 'EACH', 'ROW', 'INSTEAD', 'OF', 'WHEN', 'AND', 'OR', 'NOT',
  'IF', 'THEN', 'ELSE', 'END', 'BEGIN', 'EXCEPTION', 'RETURN', 'RETURNS', 'AS',
  'DO', 'PERFORM', 'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'FROM', 'WHERE',
  'FUNCTION', 'PROCEDURE', 'TRIGGER', 'POLICY', 'USING', 'CHECK', 'WITH', 'BY',
  'TO', 'INTO', 'VALUES', 'SET', 'ON', 'AT', 'ALL', 'ANY', 'SOME', 'BETWEEN',
  'LIKE', 'ILIKE', 'SIMILAR', 'CASE', 'CAST', 'NULL', 'TRUE', 'FALSE',
  'DEFAULT', 'CONSTRAINT', 'PRIMARY', 'FOREIGN', 'KEY', 'REFERENCES', 'UNIQUE',
  'INDEX', 'VIEW', 'SCHEMA', 'DATABASE', 'ROLE', 'USER', 'GROUP', 'GRANT', 'REVOKE',
  'COMMIT', 'ROLLBACK', 'SAVEPOINT', 'TRANSACTION', 'LOCK', 'UNLOCK', 'VACUUM',
  'ANALYZE', 'EXPLAIN', 'PREPARE', 'EXECUTE', 'DEALLOCATE', 'DECLARE', 'FETCH',
  'CLOSE', 'OPEN', 'CURSOR', 'LOOP', 'WHILE', 'REPEAT', 'UNTIL', 'CONTINUE', 'EXIT',
  'RAISE', 'NOTICE', 'WARNING', 'INFO', 'LOG', 'DEBUG', 'EXCEPTION', 'SQLSTATE',
  'MESSAGE', 'DETAIL', 'HINT', 'ERRCODE', 'COLUMN', 'COLUMNS', 'TYPE', 'ENUM',
  'SEQUENCE', 'SERIAL', 'BIGSERIAL', 'SMALLSERIAL', 'IDENTITY', 'GENERATED',
  'ALWAYS', 'TEMPORARY', 'TEMP', 'UNLOGGED', 'LOGGED', 'MATERIALIZED', 'REFRESH',
  'CONCURRENTLY', 'CASCADE', 'RESTRICT', 'NO', 'ACTION', 'DEFERRABLE', 'INITIALLY',
  'IMMEDIATE', 'DEFERRED', 'MATCH', 'FULL', 'PARTIAL', 'SIMPLE', 'NULLS', 'FIRST',
  'LAST', 'ASC', 'DESC', 'LIMIT', 'OFFSET', 'OVER', 'PARTITION', 'RANGE', 'ROWS',
  'GROUPS', 'EXCLUDE', 'CURRENT', 'FOLLOWING', 'PRECEDING', 'UNBOUNDED', 'TIES'
];

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

let errorCount = 0;
let warningCount = 0;

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(file, issue) {
  errorCount++;
  log(`❌ ERROR in ${file}:`, 'red');
  log(`   ${issue}`, 'red');
}

function warning(file, issue) {
  warningCount++;
  log(`⚠️  WARNING in ${file}:`, 'yellow');
  log(`   ${issue}`, 'yellow');
}

function checkNestedDelimiters(content, filename) {
  // Check for nested $$ delimiters which cause syntax errors
  const outerDelimiters = content.match(/\$\$/g) || [];
  
  if (outerDelimiters.length > 0) {
    // Look for DO $$ ... PERFORM cron.schedule(..., $$ SELECT ...) pattern
    const nestedPattern = /DO\s+\$\$[\s\S]*?(cron\.schedule|PERFORM)[\s\S]*?\$\$\s*(SELECT|INSERT|UPDATE|DELETE)/i;
    if (nestedPattern.test(content)) {
      error(filename, 'Nested $$ delimiters detected. Use different delimiters like $CRON$ or $BODY$ for inner blocks.');
      return false;
    }
  }
  
  return true;
}

function checkExtensionAvailability(content, filename) {
  let hasIssues = false;
  
  for (const ext of UNAVAILABLE_EXTENSIONS) {
    const extPattern = new RegExp(`CREATE\\s+EXTENSION.*${ext}`, 'i');
    const usePattern = new RegExp(`${ext}\\.`, 'i');
    
    if (extPattern.test(content) || usePattern.test(content)) {
      // Check if it's wrapped in IF NOT EXISTS or try/catch
      const safePattern = new RegExp(`(IF\\s+NOT\\s+EXISTS.*${ext}|BEGIN[\\s\\S]*?${ext}[\\s\\S]*?EXCEPTION)`, 'i');
      
      if (!safePattern.test(content)) {
        error(filename, `Uses ${ext} extension which is not available in local development. Wrap in conditional or remove.`);
        hasIssues = true;
      } else {
        warning(filename, `Uses ${ext} extension. Ensure it's properly wrapped for local compatibility.`);
      }
    }
  }
  
  return !hasIssues;
}

function checkFileNaming(filename) {
  // Check for double extensions
  if (filename.match(/\.sql\.sql$/)) {
    error(filename, 'Double .sql.sql extension detected. Should be single .sql');
    return false;
  }
  
  // Check for spaces in filename
  if (filename.includes(' ')) {
    warning(filename, 'Filename contains spaces. Consider using underscores instead.');
  }
  
  return true;
}

function checkFileTruncation(content, filename) {
  // Check if file seems truncated (very short or doesn't end properly)
  const lines = content.split('\n');
  
  if (lines.length < 5) {
    warning(filename, 'File appears very short. Verify it\'s not truncated.');
    return false;
  }
  
  // Check for incomplete SQL statements
  const trimmedContent = content.trim();
  if (trimmedContent && !trimmedContent.endsWith(';') && !trimmedContent.match(/END\s*\$\$\s*;?\s*$/i)) {
    warning(filename, 'File may be truncated - doesn\'t end with ; or END $$');
  }
  
  return true;
}

function checkSyntaxPatterns(content, filename) {
  let hasIssues = false;
  
  // Check for common syntax errors
  const patterns = [
    {
      pattern: /SELECT\s+FROM/i,
      message: 'Missing column list in SELECT statement'
    },
    {
      pattern: /\bSELECT\s+\*/i,
      message: 'Using SELECT * - consider specifying columns explicitly',
      isWarning: true
    },
    {
      pattern: /ALTER\s+DATABASE\s+postgres/i,
      message: 'ALTER DATABASE postgres is not allowed in migrations'
    }
  ];
  
  for (const { pattern, message, isWarning } of patterns) {
    if (pattern.test(content)) {
      if (isWarning) {
        warning(filename, message);
      } else {
        error(filename, message);
        hasIssues = true;
      }
    }
  }
  
  return !hasIssues;
}

// ============= DEPENDENCY VALIDATION FUNCTIONS =============

function stripComments(content) {
  // Remove SQL comments
  let result = content;
  
  // Remove single-line comments (-- comment)
  result = result.replace(/--[^\n]*/g, '');
  
  // Remove multi-line comments (/* comment */)
  result = result.replace(/\/\*[\s\S]*?\*\//g, '');
  
  return result;
}

function isSystemSchema(schema) {
  return SYSTEM_SCHEMAS.includes(schema);
}

function isSQLKeyword(word) {
  return SQL_KEYWORDS.includes(word.toUpperCase());
}

function extractTableNames(content) {
  const tables = [];
  const cleanContent = stripComments(content);
  
  // Match: CREATE TABLE [IF NOT EXISTS] schema.table or table
  const tablePattern = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:(\w+)\.)?(\w+)/gi;
  let match;
  
  while ((match = tablePattern.exec(cleanContent)) !== null) {
    const schema = match[1] || 'public';
    const table = match[2];
    
    // Skip if it's a SQL keyword
    if (isSQLKeyword(table)) {
      continue;
    }
    
    tables.push({ schema, name: table, fullName: `${schema}.${table}` });
  }
  
  return tables;
}

function extractEnumTypes(content) {
  const enums = [];
  const cleanContent = stripComments(content);
  
  // Match: CREATE TYPE [schema.]name AS ENUM
  const enumPattern = /CREATE\s+TYPE\s+(?:(\w+)\.)?(\w+)\s+AS\s+ENUM/gi;
  let match;
  
  while ((match = enumPattern.exec(cleanContent)) !== null) {
    const schema = match[1] || 'public';
    const name = match[2];
    
    // Skip if it's a SQL keyword
    if (isSQLKeyword(name)) {
      continue;
    }
    
    enums.push({ schema, name, fullName: `${schema}.${name}` });
  }
  
  return enums;
}

function extractPolicyReferences(content) {
  const policies = [];
  const cleanContent = stripComments(content);
  
  // Match: CREATE POLICY ... ON [schema.]table
  const policyPattern = /CREATE\s+(?:OR\s+REPLACE\s+)?POLICY\s+["']?(\w+)["']?\s+ON\s+(?:(\w+)\.)?(\w+)/gi;
  let match;
  
  while ((match = policyPattern.exec(cleanContent)) !== null) {
    const policyName = match[1];
    const schema = match[2] || 'public';
    const table = match[3];
    
    // Skip if it's a system schema or SQL keyword
    if (isSystemSchema(schema) || isSQLKeyword(table)) {
      continue;
    }
    
    policies.push({ 
      policyName, 
      schema, 
      table, 
      fullTableName: `${schema}.${table}` 
    });
  }
  
  return policies;
}

function extractTriggerReferences(content) {
  const triggers = [];
  const cleanContent = stripComments(content);
  
  // Match: CREATE TRIGGER ... ON [schema.]table
  // More specific pattern to avoid matching "FOR EACH ROW"
  const triggerPattern = /CREATE\s+(?:OR\s+REPLACE\s+)?TRIGGER\s+(\w+)\s+(?:BEFORE|AFTER|INSTEAD\s+OF)\s+(?:INSERT|UPDATE|DELETE|TRUNCATE)[\s\S]*?ON\s+(?:(\w+)\.)?(\w+)\s+FOR\s+EACH/gi;
  let match;
  
  while ((match = triggerPattern.exec(cleanContent)) !== null) {
    const triggerName = match[1];
    const schema = match[2] || 'public';
    const table = match[3];
    
    // Skip if table name is a SQL keyword
    if (isSQLKeyword(table)) {
      continue;
    }
    
    triggers.push({ 
      triggerName, 
      schema, 
      table, 
      fullTableName: `${schema}.${table}` 
    });
  }
  
  return triggers;
}

function extractForeignKeyReferences(content) {
  const foreignKeys = [];
  const cleanContent = stripComments(content);
  
  // Match: REFERENCES [schema.]table or FOREIGN KEY ... REFERENCES [schema.]table
  const fkPattern = /(?:REFERENCES|FOREIGN\s+KEY[\s\S]*?REFERENCES)\s+(?:(\w+)\.)?(\w+)/gi;
  let match;
  
  while ((match = fkPattern.exec(cleanContent)) !== null) {
    const schema = match[1] || 'public';
    const table = match[2];
    
    // Skip if it's a system schema or SQL keyword
    if (isSystemSchema(schema) || isSQLKeyword(table)) {
      continue;
    }
    
    foreignKeys.push({ 
      schema, 
      table, 
      fullTableName: `${schema}.${table}` 
    });
  }
  
  return foreignKeys;
}

function extractEnumAlterations(content) {
  const alterations = [];
  // Match: ALTER TYPE [schema.]enum_name ADD VALUE
  const alterPattern = /ALTER\s+TYPE\s+(?:(\w+)\.)?(\w+)\s+ADD\s+VALUE/gi;
  let match;
  
  while ((match = alterPattern.exec(content)) !== null) {
    const schema = match[1] || 'public';
    const enumName = match[2];
    alterations.push({ 
      schema, 
      enumName, 
      fullEnumName: `${schema}.${enumName}` 
    });
  }
  
  return alterations;
}

function buildObjectRegistry(migrations) {
  const registry = {
    tables: new Map(), // fullTableName -> filename
    enums: new Map(),  // fullEnumName -> filename
  };
  
  for (const { filename, content } of migrations) {
    // Register tables
    const tables = extractTableNames(content);
    for (const table of tables) {
      registry.tables.set(table.fullName, filename);
    }
    
    // Register enums
    const enums = extractEnumTypes(content);
    for (const enumType of enums) {
      registry.enums.set(enumType.fullName, filename);
    }
  }
  
  return registry;
}

function checkPolicyDependencies(content, filename, registry) {
  const policies = extractPolicyReferences(content);
  let hasIssues = false;
  
  for (const policy of policies) {
    if (!registry.tables.has(policy.fullTableName)) {
      error(
        filename, 
        `Policy "${policy.policyName}" references table "${policy.fullTableName}" which doesn't exist in any migration.`
      );
      hasIssues = true;
    }
  }
  
  return !hasIssues;
}

function checkTriggerDependencies(content, filename, registry) {
  const triggers = extractTriggerReferences(content);
  let hasIssues = false;
  
  for (const trigger of triggers) {
    if (!registry.tables.has(trigger.fullTableName)) {
      error(
        filename, 
        `Trigger "${trigger.triggerName}" references table "${trigger.fullTableName}" which doesn't exist in any migration.`
      );
      hasIssues = true;
    }
  }
  
  return !hasIssues;
}

function checkForeignKeyDependencies(content, filename, registry) {
  const foreignKeys = extractForeignKeyReferences(content);
  let hasIssues = false;
  
  for (const fk of foreignKeys) {
    if (!registry.tables.has(fk.fullTableName)) {
      error(
        filename, 
        `Foreign key references table "${fk.fullTableName}" which doesn't exist in any migration.`
      );
      hasIssues = true;
    }
  }
  
  return !hasIssues;
}

function checkEnumDependencies(content, filename, registry) {
  const alterations = extractEnumAlterations(content);
  let hasIssues = false;
  
  for (const alt of alterations) {
    if (!registry.enums.has(alt.fullEnumName)) {
      error(
        filename, 
        `ALTER TYPE references enum "${alt.fullEnumName}" which doesn't exist in any migration.`
      );
      hasIssues = true;
    }
  }
  
  return !hasIssues;
}

function checkDuplicateRealtimePublications(migrations) {
  let hasIssues = false;
  const publicationTables = new Map(); // tableName -> first migration file
  
  for (const { filename, content } of migrations) {
    const cleanContent = stripComments(content);
    
    // Check for idempotent pattern - skip files that use DO $$ IF NOT EXISTS
    const hasIdempotentPattern = /DO\s*\$\$[\s\S]*?IF\s+NOT\s+EXISTS[\s\S]*?ALTER\s+PUBLICATION\s+supabase_realtime/i.test(cleanContent);
    
    if (hasIdempotentPattern) {
      // File uses idempotent pattern, skip duplicate check for this file
      continue;
    }
    
    // Updated regex to capture schema-qualified table names (e.g., public.user_verifications)
    const matches = [...cleanContent.matchAll(/ALTER\s+PUBLICATION\s+supabase_realtime\s+ADD\s+TABLE\s+([\w.]+)/gi)];
    
    for (const match of matches) {
      const tableName = match[1];
      
      if (publicationTables.has(tableName)) {
        error(
          filename,
          `Table "${tableName}" added to supabase_realtime publication in multiple migrations.\n` +
          `   First: ${publicationTables.get(tableName)}\n` +
          `   Duplicate: ${filename}\n` +
          `   Fix: Use idempotent DO $$ IF NOT EXISTS pattern in the later migration.`
        );
        hasIssues = true;
      } else {
        publicationTables.set(tableName, filename);
      }
    }
  }
  
  return !hasIssues;
}

function checkDependencyOrdering(migrations, registry) {
  let hasIssues = false;
  
  // Track objects as we process migrations in order
  const availableTables = new Set();
  const availableEnums = new Set();
  
  for (const { filename, content } of migrations) {
    // First, add this migration's objects to available sets so we can check same-file creation
    const currentFileTables = extractTableNames(content);
    const currentFileEnums = extractEnumTypes(content);
    const currentFileTableNames = new Set(currentFileTables.map(t => t.fullName));
    const currentFileEnumNames = new Set(currentFileEnums.map(e => e.fullName));
    
    // Check if references are available BEFORE we add this migration's objects
    const policies = extractPolicyReferences(content);
    for (const policy of policies) {
      // Skip if table is created in the same file
      if (currentFileTableNames.has(policy.fullTableName)) {
        continue;
      }
      
      if (!availableTables.has(policy.fullTableName)) {
        const createdIn = registry.tables.get(policy.fullTableName);
        if (createdIn && createdIn !== filename) {
          error(
            filename,
            `Policy "${policy.policyName}" references table "${policy.fullTableName}" which is created later in: ${createdIn}\n` +
            `   Fix: Move this migration after ${createdIn} or merge them.`
          );
          hasIssues = true;
        }
      }
    }
    
    const triggers = extractTriggerReferences(content);
    for (const trigger of triggers) {
      // Skip if table is created in the same file
      if (currentFileTableNames.has(trigger.fullTableName)) {
        continue;
      }
      
      if (!availableTables.has(trigger.fullTableName)) {
        const createdIn = registry.tables.get(trigger.fullTableName);
        if (createdIn && createdIn !== filename) {
          error(
            filename,
            `Trigger "${trigger.triggerName}" references table "${trigger.fullTableName}" which is created later in: ${createdIn}\n` +
            `   Fix: Move this migration after ${createdIn} or merge them.`
          );
          hasIssues = true;
        }
      }
    }
    
    const foreignKeys = extractForeignKeyReferences(content);
    for (const fk of foreignKeys) {
      // Skip if table is created in the same file
      if (currentFileTableNames.has(fk.fullTableName)) {
        continue;
      }
      
      if (!availableTables.has(fk.fullTableName)) {
        const createdIn = registry.tables.get(fk.fullTableName);
        if (createdIn && createdIn !== filename) {
          error(
            filename,
            `Foreign key references table "${fk.fullTableName}" which is created later in: ${createdIn}\n` +
            `   Fix: Move this migration after ${createdIn} or ensure the table exists first.`
          );
          hasIssues = true;
        }
      }
    }
    
    const enumAlterations = extractEnumAlterations(content);
    for (const alt of enumAlterations) {
      // Skip if enum is created in the same file
      if (currentFileEnumNames.has(alt.fullEnumName)) {
        continue;
      }
      
      if (!availableEnums.has(alt.fullEnumName)) {
        const createdIn = registry.enums.get(alt.fullEnumName);
        if (createdIn && createdIn !== filename) {
          error(
            filename,
            `ALTER TYPE references enum "${alt.fullEnumName}" which is created later in: ${createdIn}\n` +
            `   Fix: Move this migration after ${createdIn} or merge them.`
          );
          hasIssues = true;
        }
      }
    }
    
    // Now add this migration's objects to available sets for next migrations
    for (const table of currentFileTables) {
      availableTables.add(table.fullName);
    }
    
    for (const enumType of currentFileEnums) {
      availableEnums.add(enumType.fullName);
    }
  }
  
  return !hasIssues;
}

function validateMigration(filename, content, registry) {
  log(`\nChecking ${filename}...`, 'cyan');
  
  let isValid = true;
  
  // Run all checks
  isValid = checkFileNaming(filename) && isValid;
  isValid = checkFileTruncation(content, filename) && isValid;
  isValid = checkNestedDelimiters(content, filename) && isValid;
  isValid = checkExtensionAvailability(content, filename) && isValid;
  isValid = checkSyntaxPatterns(content, filename) && isValid;
  
  // Run dependency checks
  isValid = checkPolicyDependencies(content, filename, registry) && isValid;
  isValid = checkTriggerDependencies(content, filename, registry) && isValid;
  isValid = checkForeignKeyDependencies(content, filename, registry) && isValid;
  isValid = checkEnumDependencies(content, filename, registry) && isValid;
  
  if (isValid) {
    log(`   ✅ No critical issues found`, 'green');
  }
  
  return isValid;
}

function main() {
  log('🔍 Migration Validation Tool', 'blue');
  log('==============================\n', 'blue');
  
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    log(`❌ Migrations directory not found: ${MIGRATIONS_DIR}`, 'red');
    process.exit(1);
  }
  
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();
  
  log(`Found ${files.length} migration files\n`, 'cyan');
  
  // First pass: Load all migrations and build object registry
  log('🔧 Building object registry...', 'cyan');
  const migrations = [];
  
  for (const file of files) {
    const filepath = path.join(MIGRATIONS_DIR, file);
    try {
      const content = fs.readFileSync(filepath, 'utf8');
      migrations.push({ filename: file, content });
    } catch (err) {
      error(file, `Failed to read file: ${err.message}`);
    }
  }
  
  const registry = buildObjectRegistry(migrations);
  log(`   Found ${registry.tables.size} tables and ${registry.enums.size} enums\n`, 'cyan');
  
  // Second pass: Validate each migration
  let allValid = true;
  
  for (const { filename, content } of migrations) {
    const isValid = validateMigration(filename, content, registry);
    if (!isValid) {
      allValid = false;
    }
  }
  
  // Third pass: Check dependency ordering
  log('\n🔗 Checking dependency ordering...', 'cyan');
  const orderingValid = checkDependencyOrdering(migrations, registry);
  if (!orderingValid) {
    allValid = false;
  } else {
    log('   ✅ All dependencies are in correct order\n', 'green');
  }
  
  // Fourth pass: Check for duplicate realtime publications
  log('🔄 Checking for duplicate realtime publications...', 'cyan');
  const publicationsValid = checkDuplicateRealtimePublications(migrations);
  if (!publicationsValid) {
    allValid = false;
  } else {
    log('   ✅ No duplicate realtime publications found\n', 'green');
  }
  
  log('\n==============================', 'blue');
  log('Validation Summary:', 'blue');
  log(`  Total migrations: ${files.length}`, 'cyan');
  log(`  Errors: ${errorCount}`, errorCount > 0 ? 'red' : 'green');
  log(`  Warnings: ${warningCount}`, warningCount > 0 ? 'yellow' : 'green');
  
  if (allValid && errorCount === 0) {
    log('\n✅ All migrations passed validation!', 'green');
    log('   Safe to run: npx supabase db reset', 'green');
    process.exit(0);
  } else {
    log('\n❌ Validation failed!', 'red');
    log('   Fix the errors above before running db reset', 'red');
    process.exit(1);
  }
}

// Run validation
main();
