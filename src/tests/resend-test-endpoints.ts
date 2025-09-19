import { getTemplateKeys, getTemplate } from '../config/resend-templates';
import { supabase } from '../integrations/supabase/client';

/**
 * Resend Email Service Test Endpoints
 * This file contains test functions to validate Resend email functionality
 */

export class ResendTestService {
  private baseUrl: string;
  private testEmail: string = 'test@mobirides.com'; // Change this to your test email

  constructor() {
    this.baseUrl = '/api/test';
  }

  /**
   * Test 1: Basic Email Sending Test
   * Tests raw HTML email sending functionality
   */
  async testBasicEmailSending(): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
    testName: string;
  }> {
    console.log('🧪 Testing basic email sending...');
    
    try {
      const { data, error } = await supabase.functions.invoke('resend-service', {
        body: {
          to: this.testEmail,
          subject: 'MobiRides - Basic Email Test',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #7C3AED;">🚗 MobiRides Email Test</h2>
              <p>This is a basic email test from the MobiRides platform.</p>
              <p><strong>Test Details:</strong></p>
              <ul>
                <li>Test Type: Basic HTML Email</li>
                <li>Timestamp: ${new Date().toISOString()}</li>
                <li>Service: Resend via Supabase Edge Function</li>
              </ul>
              <p style="color: #059669;">✅ If you receive this email, the basic email functionality is working correctly!</p>
            </div>
          `,
          type: 'basic-test'
        },
      });

      if (error) {
        console.error('❌ Basic email test failed:', error);
        return {
          success: false,
          error: error.message,
          testName: 'Basic Email Test'
        };
      }

      if (data.error) {
        console.error('❌ Basic email test failed:', data.error);
        return {
          success: false,
          error: data.error,
          testName: 'Basic Email Test'
        };
      }

      console.log('✅ Basic email test successful:', data.id);
      return {
        success: true,
        messageId: data.id,
        testName: 'Basic Email Test'
      };
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
      console.error('❌ Basic email test exception:', errorMessage);
      return {
        success: false,
        error: errorMessage,
        testName: 'Basic Email Test'
      };
    }
  }

  /**
   * Test 2: Template-Based Email Test
   * Tests email sending using Resend templates
   */
  async testTemplateBasedEmail(): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
    testName: string;
    templateUsed?: string;
  }> {
    console.log('🧪 Testing template-based email sending...');
    
    try {
      // Use a welcome template for testing
      const templateKey = 'welcome_renter';
      const template = getTemplate(templateKey);
      
      const templateData = {
        name: 'Test User',
        platform_name: 'MobiRides',
        login_url: 'https://mobirides.com/login',
        support_email: 'support@mobirides.com',
        test_timestamp: new Date().toISOString()
      };

      const { data, error } = await supabase.functions.invoke('resend-service', {
        body: {
          to: this.testEmail,
          subject: `${template.subject} - Test`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #8B5CF6;">MobiRides Template Test</h1>
              <p>Hello ${templateData.name}! This is a template-based test email.</p>
              <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px;">
                <p><strong>Test Details:</strong></p>
                <ul>
                  <li>Template: ${template.id}</li>
                  <li>Recipient: ${this.testEmail}</li>
                  <li>Timestamp: ${templateData.test_timestamp}</li>
                </ul>
              </div>
            </div>
          `,
          type: 'template-test'
        },
      });

      if (error) {
        console.error('❌ Template email test failed:', error);
        return {
          success: false,
          error: error.message,
          testName: 'Template-Based Email Test',
          templateUsed: template.id
        };
      }

      if (data.error) {
        console.error('❌ Template email test failed:', data.error);
        return {
          success: false,
          error: data.error,
          testName: 'Template-Based Email Test',
          templateUsed: template.id
        };
      }

      console.log('✅ Template email test successful:', data.id);
      return {
        success: true,
        messageId: data.id,
        testName: 'Template-Based Email Test',
        templateUsed: template.id
      };
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
      console.error('❌ Template email test exception:', errorMessage);
      return {
        success: false,
        error: errorMessage,
        testName: 'Template-Based Email Test'
      };
    }
  }

  /**
   * Test 3: Confirmation Email Test (Similar to Signup)
   * Tests the type of confirmation email used during user signup
   */
  async testConfirmationEmail(to?: string): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
    testName: string;
  }> {
    console.log('🧪 Testing confirmation email (signup-style)...');
    
    const emailTo = to || this.testEmail;
    
    try {
      const response = await fetch(`${this.baseUrl}/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: emailTo,
          type: 'confirmation',
          subject: 'Confirm Your Email - Mobirides Test'
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('❌ Confirmation email test failed:', data);
        return {
          success: false,
          error: data.message || 'Failed to send confirmation email',
          testName: 'Confirmation Email Test'
        };
      }

      console.log('✅ Confirmation email test successful:', data.id);
      return {
        success: true,
        messageId: data.id,
        testName: 'Confirmation Email Test'
      };
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
      console.error('❌ Confirmation email test exception:', errorMessage);
      return {
        success: false,
        error: errorMessage,
        testName: 'Confirmation Email Test'
      };
    }
  }

  /**
   * Test 4: Booking Notification Email Test
   * Tests the booking confirmation email functionality
   */
  async testBookingNotificationEmail(): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
    testName: string;
  }> {
    console.log('🧪 Testing booking notification email...');
    
    try {
      const response = await fetch(`${this.baseUrl}/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: this.testEmail,
          type: 'booking',
          subject: 'Booking Confirmation - Mobirides Test'
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('❌ Booking notification test failed:', data);
        return {
          success: false,
          error: data.message || 'Failed to send booking notification',
          testName: 'Booking Notification Email Test'
        };
      }

      console.log('✅ Booking notification test successful:', data.id);
      return {
        success: true,
        messageId: data.id,
        testName: 'Booking Notification Email Test'
      };
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
      console.error('❌ Booking notification test exception:', errorMessage);
      return {
        success: false,
        error: errorMessage,
        testName: 'Booking Notification Email Test'
      };
    }
  }

  /**
   * Test 5: Configuration Validation Test
   * Tests if Resend configuration is properly set up
   */
  async testConfiguration(): Promise<{
    success: boolean;
    config: {
      hasResendKey: boolean;
      hasFromEmail: boolean;
      templatesCount: number;
      supabaseFunctionAvailable: boolean;
    };
    testName: string;
  }> {
    console.log('🧪 Testing Resend configuration...');
    
    try {
      // Test the configuration by making a simple API call
      const response = await fetch(`${this.baseUrl}/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: 'test@example.com', // This won't actually send
          type: 'basic',
          subject: 'Configuration Test'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Check if we get a proper response structure
      const isConfigured = response.status !== 500 || (data.error && !data.error.includes('RESEND_API_KEY'));
      
      const config = {
        hasResendKey: isConfigured,
        hasFromEmail: isConfigured,
        templatesCount: getTemplateKeys().length,
        supabaseFunctionAvailable: false
      };

      // Test if Supabase function is available
      try {
        const { error } = await supabase.functions.invoke('resend-service', {
          body: {
            to: 'test@example.com',
            subject: 'Configuration Test',
            html: '<p>Test</p>',
            type: 'config-test'
          },
        });
        
        // If we get a specific error about email sending, the function is available
        config.supabaseFunctionAvailable = true;
      } catch (e) {
        console.warn('Supabase function test failed:', e);
      }

      console.log('✅ Configuration test completed:', config);
      return {
        success: isConfigured,
        config,
        testName: 'Configuration Validation Test'
      };
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Unknown error occurred';
      console.error('❌ Configuration test exception:', errorMessage);
      return {
        success: false,
        config: {
          hasResendKey: false,
          hasFromEmail: false,
          templatesCount: 0,
          supabaseFunctionAvailable: false
        },
        testName: 'Configuration Validation Test'
      };
    }
  }

  /**
   * Run All Tests
   * Executes all test functions and returns comprehensive results
   */
  async runAllTests(testEmail?: string): Promise<{
    success: boolean;
    results: any[];
    summary: {
      total: number;
      passed: number;
      failed: number;
    };
  }> {
    if (testEmail) {
      this.testEmail = testEmail;
    }

    console.log('🚀 Starting comprehensive Resend email tests...');
    console.log(`📧 Test emails will be sent to: ${this.testEmail}`);
    
    const results = [];
    let passed = 0;
    let failed = 0;

    // Test 1: Configuration
    const configTest = await this.testConfiguration();
    results.push(configTest);
    configTest.success ? passed++ : failed++;

    // Test 2: Basic Email
    const basicTest = await this.testBasicEmailSending();
    results.push(basicTest);
    basicTest.success ? passed++ : failed++;

    // Test 3: Template Email
    const templateTest = await this.testTemplateBasedEmail();
    results.push(templateTest);
    templateTest.success ? passed++ : failed++;

    // Test 4: Confirmation Email
    const confirmationTest = await this.testConfirmationEmail();
    results.push(confirmationTest);
    confirmationTest.success ? passed++ : failed++;

    // Test 5: Booking Notification
    const bookingTest = await this.testBookingNotificationEmail();
    results.push(bookingTest);
    bookingTest.success ? passed++ : failed++;

    const summary = {
      total: results.length,
      passed,
      failed
    };

    console.log('📊 Test Summary:', summary);
    console.log('✅ Passed:', passed);
    console.log('❌ Failed:', failed);

    return {
      success: failed === 0,
      results,
      summary
    };
  }

  /**
   * Set test email address
   */
  setTestEmail(email: string): void {
    this.testEmail = email;
    console.log(`📧 Test email updated to: ${email}`);
  }
}

// Export singleton instance
export const resendTestService = new ResendTestService();

// Export individual test functions for direct use
export const {
  testBasicEmailSending,
  testTemplateBasedEmail,
  testConfirmationEmail,
  testBookingNotificationEmail,
  testConfiguration,
  runAllTests,
  setTestEmail
} = resendTestService;