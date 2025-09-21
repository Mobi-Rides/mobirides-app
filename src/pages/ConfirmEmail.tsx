import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Info } from 'lucide-react';
import { toast } from 'sonner';

const ConfirmEmail: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Show info message and redirect after a short delay
    toast.info('Email confirmation is no longer required!');
    
    const timer = setTimeout(() => {
      navigate('/login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  const renderContent = () => {
    return (
      <div className="text-center">
        <Info className="w-16 h-16 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Confirmation No Longer Required</h2>
        <p className="text-gray-600 mb-4">
          Great news! We've simplified our signup process. Email confirmation is no longer required.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
          <p className="text-green-800 font-medium">Your account is ready to use!</p>
          <p className="text-green-700 text-sm mt-1">
            You can now sign in directly with your credentials.
          </p>
        </div>
        <p className="text-sm text-gray-500 mb-4">Redirecting you to the login page...</p>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
        >
          Go to Login
        </button>
      </div>
    );
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