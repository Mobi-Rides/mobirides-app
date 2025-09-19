/**
 * Email Confirmation Service Test
 * Tests the new backend email confirmation API with SMTP configuration
 */

export interface EmailConfirmationTestResult {
  success: boolean;
  messageId?: string;
  error?: string;
  testName: string;
  token?: string;
}

export class EmailConfirmationTestService {
  private baseUrl: string;
  private testEmail: string = 'test@mobirides.com';

  constructor() {
    this.baseUrl = 'http://localhost:3001/api';
  }

  setTestEmail(email: string) {
    this.testEmail = email;
  }

  /**
   * Test 1: Send Confirmation Email
   * Tests sending a confirmation email via the new backend API
   */
  async testSendConfirmationEmail(email?: string): Promise<EmailConfirmationTestResult> {
    console.log('🧪 Testing send confirmation email via backend API...');
    
    const emailTo = email || this.testEmail;
    
    try {
      const response = await fetch(`${this.baseUrl}/email/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send',
          email: emailTo,
          fullName: 'Test User',
          password: 'testpassword123',
          phoneNumber: '+26771234567'
        }),
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        console.error('❌ Send confirmation email test failed:', data.error);
        return {
          success: false,
          error: data.error || 'Failed to send confirmation email',
          testName: 'Send Confirmation Email Test'
        };
      }

      console.log('✅ Send confirmation email test successful:', data.messageId);
      return {
        success: true,
        messageId: data.messageId,
        token: data.token,
        testName: 'Send Confirmation Email Test'
      };
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
      console.error('❌ Send confirmation email test exception:', errorMessage);
      return {
        success: false,
        error: errorMessage,
        testName: 'Send Confirmation Email Test'
      };
    }
  }

  /**
   * Test 2: Verify Confirmation Token
   * Tests verifying a confirmation token via the backend API
   */
  async testVerifyConfirmationToken(token: string): Promise<EmailConfirmationTestResult> {
    console.log('🧪 Testing verify confirmation token via backend API...');
    
    try {
      const response = await fetch(`${this.baseUrl}/email/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'verify',
          token: token
        }),
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        console.error('❌ Verify confirmation token test failed:', data.error);
        return {
          success: false,
          error: data.error || 'Failed to verify confirmation token',
          testName: 'Verify Confirmation Token Test'
        };
      }

      console.log('✅ Verify confirmation token test successful:', data.userData);
      return {
        success: true,
        testName: 'Verify Confirmation Token Test'
      };
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
      console.error('❌ Verify confirmation token test exception:', errorMessage);
      return {
        success: false,
        error: errorMessage,
        testName: 'Verify Confirmation Token Test'
      };
    }
  }

  /**
   * Test 3: Resend Confirmation Email
   * Tests resending a confirmation email via the backend API
   */
  async testResendConfirmationEmail(email?: string): Promise<EmailConfirmationTestResult> {
    console.log('🧪 Testing resend confirmation email via backend API...');
    
    const emailTo = email || this.testEmail;
    
    try {
      const response = await fetch(`${this.baseUrl}/email/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'resend',
          email: emailTo
        }),
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        console.error('❌ Resend confirmation email test failed:', data.error);
        return {
          success: false,
          error: data.error || 'Failed to resend confirmation email',
          testName: 'Resend Confirmation Email Test'
        };
      }

      console.log('✅ Resend confirmation email test successful:', data.messageId);
      return {
        success: true,
        messageId: data.messageId,
        testName: 'Resend Confirmation Email Test'
      };
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
      console.error('❌ Resend confirmation email test exception:', errorMessage);
      return {
        success: false,
        error: errorMessage,
        testName: 'Resend Confirmation Email Test'
      };
    }
  }

  /**
   * Test 4: Full Email Confirmation Flow
   * Tests the complete email confirmation workflow
   */
  async testFullConfirmationFlow(email?: string): Promise<{
    success: boolean;
    results: EmailConfirmationTestResult[];
    summary: {
      total: number;
      passed: number;
      failed: number;
    };
  }> {
    console.log('🚀 Testing full email confirmation flow...');
    
    const emailTo = email || this.testEmail;
    const results: EmailConfirmationTestResult[] = [];
    
    // Step 1: Send confirmation email
    const sendResult = await this.testSendConfirmationEmail(emailTo);
    results.push(sendResult);
    
    let token: string | undefined;
    if (sendResult.success && sendResult.token) {
      token = sendResult.token;
      
      // Step 2: Verify the token
      const verifyResult = await this.testVerifyConfirmationToken(token);
      results.push(verifyResult);
    }
    
    // Step 3: Test resend functionality (this will only work if there's still a pending confirmation)
    const resendResult = await this.testResendConfirmationEmail(emailTo);
    results.push(resendResult);
    
    const summary = {
      total: results.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    };
    
    const success = summary.failed === 0;
    
    console.log('📊 Full confirmation flow test summary:', summary);
    
    return {
      success,
      results,
      summary
    };
  }

  /**
   * Test SMTP Configuration
   * Tests if the SMTP configuration is working properly
   */
  async testSMTPConfiguration(): Promise<EmailConfirmationTestResult> {
    console.log('🧪 Testing SMTP configuration...');
    
    try {
      // Try to send a simple confirmation email to test SMTP
      const result = await this.testSendConfirmationEmail('test@example.com');
      
      if (result.success) {
        return {
          success: true,
          testName: 'SMTP Configuration Test',
          messageId: result.messageId
        };
      } else {
        // Check if the error is SMTP-related
        const isSmtpError = result.error && (
          result.error.includes('SMTP') ||
          result.error.includes('authentication') ||
          result.error.includes('EAUTH') ||
          result.error.includes('Invalid login') ||
          result.error.includes('ENOTFOUND')
        );
        
        return {
          success: false,
          error: isSmtpError ? result.error : 'SMTP configuration appears to be working, but email sending failed',
          testName: 'SMTP Configuration Test'
        };
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
      console.error('❌ SMTP configuration test exception:', errorMessage);
      return {
        success: false,
        error: errorMessage,
        testName: 'SMTP Configuration Test'
      };
    }
  }
}

// Export singleton instance
export const emailConfirmationTestService = new EmailConfirmationTestService();

// Export individual test functions for direct use
export const {
  testSendConfirmationEmail,
  testVerifyConfirmationToken,
  testResendConfirmationEmail,
  testFullConfirmationFlow,
  testSMTPConfiguration,
  setTestEmail
} = emailConfirmationTestService;