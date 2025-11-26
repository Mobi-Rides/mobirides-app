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

function validateMigration(filename) {
  const filepath = path.join(MIGRATIONS_DIR, filename);
  
  // Skip non-SQL files
  if (!filename.endsWith('.sql')) {
    return true;
  }
  
  log(`\nChecking ${filename}...`, 'cyan');
  
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    
    let isValid = true;
    
    // Run all checks
    isValid = checkFileNaming(filename) && isValid;
    isValid = checkFileTruncation(content, filename) && isValid;
    isValid = checkNestedDelimiters(content, filename) && isValid;
    isValid = checkExtensionAvailability(content, filename) && isValid;
    isValid = checkSyntaxPatterns(content, filename) && isValid;
    
    if (isValid) {
      log(`   ✅ No critical issues found`, 'green');
    }
    
    return isValid;
    
  } catch (err) {
    error(filename, `Failed to read or parse file: ${err.message}`);
    return false;
  }
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
  
  let allValid = true;
  
  for (const file of files) {
    const isValid = validateMigration(file);
    if (!isValid) {
      allValid = false;
    }
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
