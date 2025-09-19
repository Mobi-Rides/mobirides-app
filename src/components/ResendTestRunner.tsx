import React, { useState } from 'react';
import { resendTestService } from '../tests/resend-test-endpoints';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Loader2, Mail, CheckCircle, XCircle, Play, Settings } from 'lucide-react';
import { toast } from 'sonner';

interface TestResult {
  success: boolean;
  messageId?: string;
  error?: string;
  testName: string;
  templateUsed?: string;
  config?: any;
}

interface TestSummary {
  total: number;
  passed: number;
  failed: number;
}

export const ResendTestRunner: React.FC = () => {
  const [testEmail, setTestEmail] = useState('test@mobirides.com');
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [results, setResults] = useState<TestResult[]>([]);
  const [summary, setSummary] = useState<TestSummary | null>(null);
  const [showResults, setShowResults] = useState(false);

  const runIndividualTest = async (testName: string, testFunction: () => Promise<TestResult>) => {
    setCurrentTest(testName);
    try {
      const result = await testFunction();
      setResults(prev => [...prev, result]);
      
      if (result.success) {
        toast.success(`${testName} passed`, {
          description: result.messageId ? `Message ID: ${result.messageId}` : 'Test completed successfully'
        });
      } else {
        toast.error(`${testName} failed`, {
          description: result.error || 'Unknown error occurred'
        });
      }
      
      return result;
    } catch (error) {
      const errorResult: TestResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        testName
      };
      setResults(prev => [...prev, errorResult]);
      toast.error(`${testName} failed`, {
        description: errorResult.error
      });
      return errorResult;
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);
    setSummary(null);
    setShowResults(true);
    
    try {
      // Update test email
      resendTestService.setTestEmail(testEmail);
      
      toast.info('Starting Resend email tests...', {
        description: `Test emails will be sent to ${testEmail}`
      });

      const testResults = await resendTestService.runAllTests(testEmail);
      
      setResults(testResults.results);
      setSummary(testResults.summary);
      
      if (testResults.success) {
        toast.success('All tests passed!', {
          description: `${testResults.summary.passed}/${testResults.summary.total} tests successful`
        });
      } else {
        toast.warning('Some tests failed', {
          description: `${testResults.summary.failed}/${testResults.summary.total} tests failed`
        });
      }
    } catch (error) {
      toast.error('Test execution failed', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsRunning(false);
      setCurrentTest('');
    }
  };

  const runSingleTest = async (testType: string) => {
    setIsRunning(true);
    setCurrentTest(testType);
    
    try {
      resendTestService.setTestEmail(testEmail);
      
      let result: TestResult;
      
      switch (testType) {
        case 'configuration':
          result = await resendTestService.testConfiguration();
          break;
        case 'basic':
          result = await resendTestService.testBasicEmailSending();
          break;
        case 'template':
          result = await resendTestService.testTemplateBasedEmail();
          break;
        case 'confirmation':
          result = await resendTestService.testConfirmationEmail();
          break;
        case 'booking':
          result = await resendTestService.testBookingNotificationEmail();
          break;
        default:
          throw new Error('Unknown test type');
      }
      
      setResults(prev => {
        const filtered = prev.filter(r => r.testName !== result.testName);
        return [...filtered, result];
      });
      setShowResults(true);
      
      if (result.success) {
        toast.success(`${result.testName} passed`);
      } else {
        toast.error(`${result.testName} failed`, {
          description: result.error
        });
      }
    } catch (error) {
      toast.error('Test failed', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsRunning(false);
      setCurrentTest('');
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getStatusBadge = (success: boolean) => {
    return (
      <Badge variant={success ? "default" : "destructive"}>
        {success ? 'PASSED' : 'FAILED'}
      </Badge>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-6 w-6 text-purple-600" />
            Resend Email Service Test Runner
          </CardTitle>
          <CardDescription>
            Test the Resend email integration for MobiRides. Make sure to use a valid email address that you can access.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label htmlFor="testEmail" className="block text-sm font-medium mb-2">
                Test Email Address
              </label>
              <Input
                id="testEmail"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Enter your test email address"
                disabled={isRunning}
              />
            </div>
            <Button
              onClick={runAllTests}
              disabled={isRunning || !testEmail}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run All Tests
                </>
              )}
            </Button>
          </div>
          
          {isRunning && currentTest && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Currently running: {currentTest}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuration Test
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              size="sm"
              onClick={() => runSingleTest('configuration')}
              disabled={isRunning}
              className="w-full"
            >
              Test Config
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Basic Email Test</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              size="sm"
              onClick={() => runSingleTest('basic')}
              disabled={isRunning}
              className="w-full"
            >
              Test Basic Email
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Template Email Test</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              size="sm"
              onClick={() => runSingleTest('template')}
              disabled={isRunning}
              className="w-full"
            >
              Test Template
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Confirmation Email</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              size="sm"
              onClick={() => runSingleTest('confirmation')}
              disabled={isRunning}
              className="w-full"
            >
              Test Confirmation
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Booking Notification</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              size="sm"
              onClick={() => runSingleTest('booking')}
              disabled={isRunning}
              className="w-full"
            >
              Test Booking Email
            </Button>
          </CardContent>
        </Card>
      </div>

      {showResults && (summary || results.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            {summary && (
              <div className="flex gap-4 text-sm">
                <span>Total: {summary.total}</span>
                <span className="text-green-600">Passed: {summary.passed}</span>
                <span className="text-red-600">Failed: {summary.failed}</span>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div key={index} className="flex items-start justify-between p-3 border rounded-lg">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(result.success)}
                    <div>
                      <div className="font-medium">{result.testName}</div>
                      {result.messageId && (
                        <div className="text-xs text-gray-500 mt-1">
                          Message ID: {result.messageId}
                        </div>
                      )}
                      {result.templateUsed && (
                        <div className="text-xs text-gray-500 mt-1">
                          Template: {result.templateUsed}
                        </div>
                      )}
                      {result.error && (
                        <div className="text-xs text-red-600 mt-1">
                          Error: {result.error}
                        </div>
                      )}
                      {result.config && (
                        <div className="text-xs text-gray-600 mt-1">
                          Templates: {result.config.templatesCount} | 
                          Function Available: {result.config.supabaseFunctionAvailable ? 'Yes' : 'No'}
                        </div>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(result.success)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ResendTestRunner;