import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { emailConfirmationService } from '../services/emailConfirmationService';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';

const ConfirmEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid confirmation link. Please check your email and try again.');
      return;
    }

    confirmEmail();
  }, [token]);

  const confirmEmail = async () => {
    if (!token) return;

    try {
      const result = await emailConfirmationService.confirmEmail(token);
      
      if (result.success) {
        setStatus('success');
        setMessage('Your email has been confirmed successfully! You can now sign in to your account.');
        
        // Redirect to sign in page after 3 seconds
        setTimeout(() => {
          navigate('/auth?tab=signin');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(result.error || 'Failed to confirm email. Please try again.');
      }
    } catch (error) {
      console.error('Error confirming email:', error);
      setStatus('error');
      setMessage('An unexpected error occurred. Please try again.');
    }
  };

  const handleResendConfirmation = async () => {
    if (!email.trim()) {
      alert('Please enter your email address');
      return;
    }

    setIsResending(true);
    try {
      const result = await emailConfirmationService.resendConfirmation(email);
      
      if (result.success) {
        alert('Confirmation email sent! Please check your inbox.');
      } else {
        alert(result.error || 'Failed to resend confirmation email.');
      }
    } catch (error) {
      console.error('Error resending confirmation:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-purple-600 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirming your email...</h2>
            <p className="text-gray-600">Please wait while we verify your email address.</p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Confirmed!</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">Redirecting you to sign in...</p>
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirmation Failed</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Need help?</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Enter your email to resend confirmation:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleResendConfirmation}
                      disabled={isResending}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isResending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Mail className="w-4 h-4" />
                      )}
                      {isResending ? 'Sending...' : 'Resend'}
                    </button>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => navigate('/auth?tab=signup')}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Back to Sign Up
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to <span className="text-purple-600">MobiRides</span>
          </h1>
        </div>
        
        <div className="bg-white shadow-lg rounded-lg p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default ConfirmEmail;