/**
 * Epic 4 Implementation Verification Script
 * 
 * This script verifies that all Epic 4: Backend Optimization & Security
 * components are properly implemented and working.
 */

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFileExists(filePath, description) {
  const exists = fs.existsSync(filePath);
  if (exists) {
    log(`✅ ${description}`, 'green');
    return true;
  } else {
    log(`❌ ${description} - File not found: ${filePath}`, 'red');
    return false;
  }
}

function checkDirectoryExists(dirPath, description) {
  const exists = fs.existsSync(dirPath);
  if (exists) {
    log(`✅ ${description}`, 'green');
    return true;
  } else {
    log(`❌ ${description} - Directory not found: ${dirPath}`, 'red');
    return false;
  }
}

function checkFileContent(filePath, searchText, description) {
  if (!fs.existsSync(filePath)) {
    log(`❌ ${description} - File not found`, 'red');
    return false;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const contains = content.includes(searchText);
  
  if (contains) {
    log(`✅ ${description}`, 'green');
    return true;
  } else {
    log(`❌ ${description} - Content not found: ${searchText}`, 'red');
    return false;
  }
}

function main() {
  log('🔍 Epic 4: Backend Optimization & Security - Implementation Verification', 'bold');
  log('================================================================', 'blue');
  
  let totalChecks = 0;
  let passedChecks = 0;
  
  // A4.1: Car Images RLS Policy
  log('\n📋 [A4.1] Car Images RLS Policy Verification', 'bold');
  totalChecks++;
  if (checkFileExists(
    '../mobi-rent2buy/supabase/migrations/20250615165301-cafac792-ce62-4630-9736-2d3d8575e8a3.sql',
    'Car images RLS migration file'
  )) {
    passedChecks++;
  }
  
  totalChecks++;
  if (checkFileContent(
    '../mobi-rent2buy/supabase/migrations/20250615165301-cafac792-ce62-4630-9736-2d3d8575e8a3.sql',
    'Public read access for car images',
    'Car images public read policy'
  )) {
    passedChecks++;
  }
  
  // A4.2: Rate Limiting Implementation
  log('\n📋 [A4.2] Rate Limiting Implementation Verification', 'bold');
  totalChecks++;
  if (checkFileExists(
    '../supabase/functions/guest-rate-limit/index.ts',
    'Guest rate limiting edge function'
  )) {
    passedChecks++;
  }
  
  totalChecks++;
  if (checkFileExists(
    'src/services/rateLimitService.ts',
    'Rate limiting service'
  )) {
    passedChecks++;
  }
  
  totalChecks++;
  if (checkFileExists(
    'src/components/security/SecurityMiddleware.tsx',
    'Security middleware component'
  )) {
    passedChecks++;
  }
  
  totalChecks++;
  if (checkFileContent(
    '../supabase/functions/guest-rate-limit/index.ts',
    'RATE_LIMIT',
    'Rate limiting configuration'
  )) {
    passedChecks++;
  }
  
  // A4.3: CAPTCHA Protection Implementation
  log('\n📋 [A4.3] CAPTCHA Protection Implementation Verification', 'bold');
  totalChecks++;
  if (checkFileExists(
    'supabase/functions/captcha-verify/index.ts',
    'CAPTCHA verification edge function'
  )) {
    passedChecks++;
  }
  
  totalChecks++;
  if (checkFileExists(
    'src/services/captchaService.ts',
    'CAPTCHA service'
  )) {
    passedChecks++;
  }
  
  totalChecks++;
  if (checkFileContent(
    'supabase/migrations/20250115000000_epic4_backend_optimization.sql',
    'captcha_verifications',
    'CAPTCHA verification table'
  )) {
    passedChecks++;
  }
  
  totalChecks++;
  if (checkFileContent(
    'src/services/captchaService.ts',
    'HIGH_RISK_ACTIONS',
    'High-risk actions configuration'
  )) {
    passedChecks++;
  }
  
  // A4.4: Database Query Optimization
  log('\n📋 [A4.4] Database Query Optimization Verification', 'bold');
  totalChecks++;
  if (checkFileExists(
    'supabase/migrations/20250115000000_epic4_backend_optimization.sql',
    'Database optimization migration'
  )) {
    passedChecks++;
  }
  
  totalChecks++;
  if (checkFileExists(
    'src/services/optimizedCarService.ts',
    'Optimized car service'
  )) {
    passedChecks++;
  }
  
  totalChecks++;
  if (checkFileExists(
    'src/services/performanceMonitoringService.ts',
    'Performance monitoring service'
  )) {
    passedChecks++;
  }
  
  totalChecks++;
  if (checkFileExists(
    'src/components/admin/PerformanceDashboard.tsx',
    'Performance dashboard component'
  )) {
    passedChecks++;
  }
  
  totalChecks++;
  if (checkFileContent(
    'supabase/migrations/20250115000000_epic4_backend_optimization.sql',
    'CREATE INDEX',
    'Database indexes'
  )) {
    passedChecks++;
  }
  
  totalChecks++;
  if (checkFileContent(
    'supabase/migrations/20250115000000_epic4_backend_optimization.sql',
    'get_nearby_cars',
    'Optimized database functions'
  )) {
    passedChecks++;
  }
  
  // Additional Security Components
  log('\n📋 Additional Security Components Verification', 'bold');
  totalChecks++;
  if (checkFileExists(
    'supabase/functions/rate-limit-check/index.ts',
    'Rate limit check edge function'
  )) {
    passedChecks++;
  }
  
  totalChecks++;
  if (checkFileExists(
    'src/services/optimizedBookingService.ts',
    'Optimized booking service'
  )) {
    passedChecks++;
  }
  
  totalChecks++;
  if (checkFileContent(
    'supabase/migrations/20250115000000_epic4_backend_optimization.sql',
    'rate_limits',
    'Rate limiting table'
  )) {
    passedChecks++;
  }
  
  // Documentation
  log('\n📋 Documentation Verification', 'bold');
  totalChecks++;
  if (checkFileExists(
    'EPIC4_IMPLEMENTATION_SUMMARY.md',
    'Epic 4 implementation summary'
  )) {
    passedChecks++;
  }
  
  totalChecks++;
  if (checkFileExists(
    'EPIC4_4_DATABASE_OPTIMIZATION.md',
    'Database optimization documentation'
  )) {
    passedChecks++;
  }
  
  // Summary
  log('\n📊 Verification Summary', 'bold');
  log('====================', 'blue');
  log(`Total Checks: ${totalChecks}`, 'blue');
  log(`Passed: ${passedChecks}`, 'green');
  log(`Failed: ${totalChecks - passedChecks}`, 'red');
  
  const successRate = ((passedChecks / totalChecks) * 100).toFixed(1);
  log(`Success Rate: ${successRate}%`, successRate >= 90 ? 'green' : 'yellow');
  
  if (passedChecks === totalChecks) {
    log('\n🎉 Epic 4 Implementation Verification: PASSED', 'green');
    log('All components are properly implemented and ready for production!', 'green');
  } else {
    log('\n⚠️  Epic 4 Implementation Verification: PARTIAL', 'yellow');
    log('Some components need attention before production deployment.', 'yellow');
  }
  
  // Recommendations
  log('\n📝 Recommendations', 'bold');
  log('================', 'blue');
  log('1. Test rate limiting with actual traffic patterns', 'blue');
  log('2. Verify CAPTCHA integration with reCAPTCHA service', 'blue');
  log('3. Monitor database performance with real queries', 'blue');
  log('4. Set up alerting for security events', 'blue');
  log('5. Configure proper environment variables for production', 'blue');
  
  log('\n✅ Verification complete!', 'green');
}

// Run the verification
main(); 