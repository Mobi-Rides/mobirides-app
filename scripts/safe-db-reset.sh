#!/bin/bash

# Safe DB Reset - Validates migrations before running reset

echo "🔒 Safe Database Reset Script"
echo "=============================="
echo ""

# Run migration validator
node scripts/validate-migrations.cjs

# Check if validation passed
if [ $? -eq 0 ]; then
  echo "🚀 Running database reset..."
  npx supabase db reset
else
  echo ""
  echo "❌ Database reset aborted due to validation errors."
  echo "   Please fix the migration issues and try again."
  exit 1
fi
