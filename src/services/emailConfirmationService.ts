import { supabase } from '../integrations/supabase/client';

export interface EmailConfirmationData {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
}

export class EmailConfirmationService {
  private API_BASE_URL: string;

  constructor() {
    this.API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api';  }

  /**
   * Send confirmation email via backend API
   */
  private async sendConfirmationEmailAPI(
    userData: EmailConfirmationData
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/email/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send',
          ...userData
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        return { success: false, error: result.error || 'Failed to send confirmation email' };
      }

      console.log('Email sent successfully via API:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending email via API:', error);
      let errorMessage = 'Failed to send confirmation email';
      
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();
        
        if (errorMsg.includes('resend api')) {
          errorMessage = 'Email service configuration error. Please contact support.';
        } else if (error.message.includes('fetch')) {
          errorMessage = 'Unable to connect to email service. Please check your internet connection.';
        } else {
          errorMessage = `Email sending failed: ${error.message}`;
        }
      }
      
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Verify email confirmation token via backend API
   */
  private async verifyConfirmationToken(token: string): Promise<{ 
    success: boolean; 
    error?: string;
    userData?: {
      id: string;
      email: string;
      fullName: string;
      phoneNumber: string;
      password: string;
    };
  }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/email/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'verify',
          token
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        return { success: false, error: result.error || 'Invalid or expired confirmation token' };
      }

      console.log('Token verified successfully via API');
      return { 
        success: true, 
        userData: result.userData 
      };
    } catch (error) {
      console.error('Error verifying token via API:', error);
      return { success: false, error: 'Failed to verify confirmation token' };
    }
  }



  /**
   * Initiate signup with email confirmation
   */
  public async initiateSignup(userData: EmailConfirmationData): Promise<{
    success: boolean;
    message: string;
    error?: string;
  }> {
    try {
      // Send confirmation email via backend API
      const emailResult = await this.sendConfirmationEmailAPI(userData);
      
      if (!emailResult.success) {
        return {
          success: false,
          message: 'Failed to send confirmation email',
          error: emailResult.error
        };
      }
      
      console.log(`📧 Confirmation email sent to ${userData.email}`);
      
      return {
        success: true,
        message: 'Confirmation email sent successfully. Please check your inbox and click the confirmation link.'
      };
    } catch (error) {
      console.error('Error in initiateSignup:', error);
      return {
        success: false,
        message: 'Failed to initiate signup process',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Confirm email and complete signup
   */
  public async confirmEmail(token: string): Promise<{ 
    success: boolean; 
    error?: string;
    userData?: {
      id: string;
      email: string;
      fullName: string;
      phoneNumber: string;
      password: string;
    };
  }> {
    try {
      // Verify token via backend API and create user account
      const verificationResult = await this.verifyConfirmationToken(token);
      
      if (!verificationResult.success) {
        return { success: false, error: verificationResult.error || 'Invalid or expired confirmation token.' };
      }

      console.log('Email confirmation completed successfully');
      return { 
        success: true, 
        userData: verificationResult.userData 
      };
    } catch (error) {
      console.error('Error confirming email:', error);
      return { success: false, error: 'An unexpected error occurred during confirmation.' };
    }
  }

  /**
   * Resend confirmation email
   */
  public async resendConfirmation(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/email/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'resend',
          email
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        return { success: false, error: result.error || 'Failed to resend confirmation email' };
      }

      console.log('Confirmation email resent successfully');
      return { success: true };
    } catch (error) {
      console.error('Error resending confirmation:', error);
      return {
        success: false,
        error: 'Failed to resend confirmation email. Please try again.'
      };
    }
  }
}

export const emailConfirmationService = new EmailConfirmationService();