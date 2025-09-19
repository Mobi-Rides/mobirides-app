import { EmailConfirmationService } from './emailConfirmationService';

// Test the email confirmation service
const testEmailService = async () => {
  console.log('Testing Email Confirmation Service with SMTP...');
  
  const emailService = EmailConfirmationService.getInstance();
  
  try {
    // Test email sending
    const testEmail = 'test@example.com';
    const testData = {
      fullName: 'Test User',
      email: testEmail,
      phoneNumber: '+267 12345678',
      password: 'testpassword123'
    };
    
    console.log('Initiating signup with test data:', testData);
    
    // This will test the SMTP configuration
    const result = await emailService.initiateSignup(testData);
    
    console.log('Signup initiation result:', result);
    
    if (result.success) {
      console.log('✅ SMTP Email service is working correctly!');
      console.log('Confirmation token generated:', result.token);
    } else {
      console.log('❌ Email service failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
};

// Export for manual testing
export { testEmailService };

// Uncomment to run test immediately
// testEmailService();