#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations');

// Common dependency patterns to check
const DEPENDENCY_PATTERNS = {
  createTable: /CREATE TABLE (?:IF NOT EXISTS )?(?:public\.)?(\w+)/gi,
  alterTable: /ALTER TABLE (?:ONLY )?(?:public\.)?(\w+)/gi,
  addConstraint: /ADD CONSTRAINT \w+ FOREIGN KEY[^)]*REFERENCES (?:public\.)?(\w+)/gi,
  insertInto: /INSERT INTO (?:public\.)?(\w+)/gi,
  references: /REFERENCES (?:public\.)?(\w+)/gi,
  createPolicy: /CREATE POLICY .* ON (?:public\.)?(\w+)/gi,
  createIndex: /CREATE (?:UNIQUE )?INDEX .* ON (?:public\.)?(\w+)/gi,
  createTrigger: /CREATE TRIGGER .* ON (?:public\.)?(\w+)/gi,
  dropTable: /DROP TABLE (?:IF EXISTS )?(?:public\.)?(\w+)/gi,
};

function getMigrationFiles() {
  try {
    return fs.readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.sql'))
      .sort()
      .map(file => ({
        name: file,
        path: path.join(MIGRATIONS_DIR, file),
        timestamp: file.split('_')[0]
      }));
  } catch (error) {
    console.error(`❌ Error reading migrations directory: ${error.message}`);
    process.exit(1);
  }
}

function analyzeMigration(content) {
  const creates = new Set();
  const dependencies = new Set();
  
  // Find table creations
  let match;
  const createRegex = new RegExp(DEPENDENCY_PATTERNS.createTable);
  while ((match = createRegex.exec(content)) !== null) {
    creates.add(match[1].toLowerCase());
  }
  
  // Find dependencies (references, foreign keys, policies, etc.)
  Object.entries(DEPENDENCY_PATTERNS).forEach(([key, pattern]) => {
    if (key === 'createTable') return; // Skip creates, we already handled them
    
    const regex = new RegExp(pattern);
    let match;
    while ((match = regex.exec(content)) !== null) {
      const tableName = match[1].toLowerCase();
      // Don't count self-references or auth schema tables
      if (!creates.has(tableName) && !tableName.startsWith('auth.')) {
        dependencies.add(tableName);
      }
    }
  });
  
  return { creates, dependencies };
}

function validateMigrations() {
  console.log('🔍 Validating migration dependencies...\n');
  
  const migrations = getMigrationFiles();
  const createdTables = new Set();
  const errors = [];
  const warnings = [];
  
  migrations.forEach((migration, index) => {
    try {
      const content = fs.readFileSync(migration.path, 'utf8');
      const { creates, dependencies } = analyzeMigration(content);
      
      // Check if dependencies exist
      dependencies.forEach(dep => {
        if (!createdTables.has(dep)) {
          // Check if it's created later
          const createdLater = migrations.slice(index + 1).some(m => {
            const laterContent = fs.readFileSync(m.path, 'utf8');
            const { creates: laterCreates } = analyzeMigration(laterContent);
            return laterCreates.has(dep);
          });
          
          if (createdLater) {
            errors.push({
              migration: migration.name,
              issue: `References table '${dep}' which is created in a later migration`,
              severity: 'error'
            });
          } else {
            // Might be a system table or external dependency
            warnings.push({
              migration: migration.name,
              issue: `References table '${dep}' which hasn't been seen yet (might be system table)`,
              severity: 'warning'
            });
          }
        }
      });
      
      // Add created tables to our tracking
      creates.forEach(table => createdTables.add(table));
      
      console.log(`✓ ${migration.name}`);
      if (creates.size > 0) {
        console.log(`  Creates: ${Array.from(creates).join(', ')}`);
      }
      if (dependencies.size > 0) {
        console.log(`  Depends on: ${Array.from(dependencies).join(', ')}`);
      }
      
    } catch (error) {
      errors.push({
        migration: migration.name,
        issue: `Failed to read or parse: ${error.message}`,
        severity: 'error'
      });
    }
  });
  
  console.log('\n' + '='.repeat(60));
  
  if (errors.length > 0) {
    console.log('\n❌ ERRORS FOUND:\n');
    errors.forEach(err => {
      console.log(`  ${err.migration}`);
      console.log(`    → ${err.issue}\n`);
    });
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:\n');
    warnings.forEach(warn => {
      console.log(`  ${warn.migration}`);
      console.log(`    → ${warn.issue}\n`);
    });
  }
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log('\n✅ All migrations validated successfully!');
    console.log(`   Total migrations: ${migrations.length}`);
    console.log(`   Tables tracked: ${createdTables.size}`);
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (errors.length > 0) {
    console.log('\n❌ Migration validation failed. Please fix the errors above before running db reset.\n');
    process.exit(1);
  } else {
    console.log('\n✅ Safe to run: npx supabase db reset\n');
    process.exit(0);
  }
}

// Run validation
validateMigrations();
