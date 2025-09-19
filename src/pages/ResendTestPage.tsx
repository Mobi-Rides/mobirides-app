import React from 'react';
import ResendTestRunner from '../components/ResendTestRunner';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';

const ResendTestPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Email Service Testing</h1>
              <p className="text-gray-600 text-sm mt-1">
                Test and validate Resend email integration for MobiRides
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="py-8">
        <ResendTestRunner />
      </div>
      
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Testing Instructions:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Enter a valid email address that you can access</li>
            <li>• Run individual tests to check specific functionality</li>
            <li>• Use "Run All Tests" to execute the complete test suite</li>
            <li>• Check your email inbox for test messages</li>
            <li>• Review test results for any configuration issues</li>
          </ul>
        </div>
        
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 mb-2">Common Issues:</h3>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• If tests fail, check the RESEND_API_KEY in your .env file</li>
            <li>• Ensure the FROM_EMAIL domain is verified in Resend</li>
            <li>• Check browser console for detailed error messages</li>
            <li>• Verify Supabase edge functions are deployed and accessible</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ResendTestPage;