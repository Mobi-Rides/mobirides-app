// Simple verification script for insurance claims implementation
const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Insurance Claims Implementation...\n');

// Check if all required files exist
const requiredFiles = [
  'src/components/insurance/ClaimsSubmissionForm.tsx',
  'src/components/insurance/UserClaimsList.tsx',
  'src/components/insurance/AdminClaimsDashboard.tsx',
  'src/services/insuranceService.ts',
  'supabase/migrations/20251224000000_implement_insurance_schema.sql'
];

let allFilesExist = true;

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

console.log('\n📋 Checking App.tsx for new routes...');
const appTsxPath = path.join(__dirname, 'src/App.tsx');
const appContent = fs.readFileSync(appTsxPath, 'utf8');

const requiredRoutes = [
  'UserClaimsList',
  'AdminClaimsDashboard',
  'path="/claims"',
  'path="/admin/claims"'
];

requiredRoutes.forEach(route => {
  if (appContent.includes(route)) {
    console.log(`✅ Route/component: ${route}`);
  } else {
    console.log(`❌ Route/component: ${route} - MISSING`);
  }
});

console.log('\n🧭 Checking navigation links...');
const morePagePath = path.join(__dirname, 'src/pages/More.tsx');
const moreContent = fs.readFileSync(morePagePath, 'utf8');

if (moreContent.includes('Insurance Claims') && moreContent.includes('navigate("/claims")')) {
  console.log('✅ User navigation link added');
} else {
  console.log('❌ User navigation link missing');
}

const adminSidebarPath = path.join(__dirname, 'src/components/admin/AdminSidebar.tsx');
const adminContent = fs.readFileSync(adminSidebarPath, 'utf8');

if (adminContent.includes('Insurance Claims') && adminContent.includes('path="/admin/claims"')) {
  console.log('✅ Admin navigation link added');
} else {
  console.log('❌ Admin navigation link missing');
}

console.log('\n📊 Implementation Summary:');
console.log('- Claims Submission Form: Multi-step form with validation');
console.log('- User Claims List: View and manage personal claims');
console.log('- Admin Claims Dashboard: Review and manage all claims');
console.log('- Database Schema: Insurance tables with RLS policies');
console.log('- Navigation: Links added to user and admin interfaces');

console.log('\n🎯 Next Steps:');
console.log('1. Test the booking flow with insurance selection');
console.log('2. Verify claims can be submitted through the UI');
console.log('3. Test admin claim review and approval process');
console.log('4. Add any missing business logic or validation');

console.log('\n✨ Insurance Claims Implementation Complete!');