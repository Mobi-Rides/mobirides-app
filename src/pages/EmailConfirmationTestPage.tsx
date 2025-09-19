import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, Clock, Mail, Send, RefreshCw, Settings } from 'lucide-react';
import { emailConfirmationTestService, EmailConfirmationTestResult } from '@/tests/email-confirmation-test';

interface TestState {
  isRunning: boolean;
  results: EmailConfirmationTestResult[];
  currentTest: string;
  fullFlowResults?: {
    success: boolean;
    results: EmailConfirmationTestResult[];
    summary: {
      total: number;
      passed: number;
      failed: number;
    };
  };
}

const EmailConfirmationTestPage: React.FC = () => {
  const [testEmail, setTestEmail] = useState('test@mobirides.com');
  const [testToken, setTestToken] = useState('');
  const [testState, setTestState] = useState<TestState>({
    isRunning: false,
    results: [],
    currentTest: ''
  });

  const updateTestState = (updates: Partial<TestState>) => {
    setTestState(prev => ({ ...prev, ...updates }));
  };

  const addResult = (result: EmailConfirmationTestResult) => {
    setTestState(prev => ({
      ...prev,
      results: [...prev.results, result]
    }));
  };

  const clearResults = () => {
    setTestState({
      isRunning: false,
      results: [],
      currentTest: '',
      fullFlowResults: undefined
    });
  };

  const runSendTest = async () => {
    updateTestState({ isRunning: true, currentTest: 'Send Confirmation Email' });
    
    try {
      emailConfirmationTestService.setTestEmail(testEmail);
      const result = await emailConfirmationTestService.testSendConfirmationEmail(testEmail);
      addResult(result);
      
      // If successful and we got a token, set it for verification test
      if (result.success && result.token) {
        setTestToken(result.token);
      }
    } catch (error) {
      addResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        testName: 'Send Confirmation Email Test'
      });
    } finally {
      updateTestState({ isRunning: false, currentTest: '' });
    }
  };

  const runVerifyTest = async () => {
    if (!testToken.trim()) {
      addResult({
        success: false,
        error: 'Please provide a token to verify',
        testName: 'Verify Confirmation Token Test'
      });
      return;
    }

    updateTestState({ isRunning: true, currentTest: 'Verify Confirmation Token' });
    
    try {
      const result = await emailConfirmationTestService.testVerifyConfirmationToken(testToken);
      addResult(result);
    } catch (error) {
      addResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        testName: 'Verify Confirmation Token Test'
      });
    } finally {
      updateTestState({ isRunning: false, currentTest: '' });
    }
  };

  const runResendTest = async () => {
    updateTestState({ isRunning: true, currentTest: 'Resend Confirmation Email' });
    
    try {
      emailConfirmationTestService.setTestEmail(testEmail);
      const result = await emailConfirmationTestService.testResendConfirmationEmail(testEmail);
      addResult(result);
    } catch (error) {
      addResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        testName: 'Resend Confirmation Email Test'
      });
    } finally {
      updateTestState({ isRunning: false, currentTest: '' });
    }
  };

  const runSMTPTest = async () => {
    updateTestState({ isRunning: true, currentTest: 'SMTP Configuration Test' });
    
    try {
      const result = await emailConfirmationTestService.testSMTPConfiguration();
      addResult(result);
    } catch (error) {
      addResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        testName: 'SMTP Configuration Test'
      });
    } finally {
      updateTestState({ isRunning: false, currentTest: '' });
    }
  };

  const runFullFlowTest = async () => {
    updateTestState({ isRunning: true, currentTest: 'Full Confirmation Flow' });
    
    try {
      emailConfirmationTestService.setTestEmail(testEmail);
      const result = await emailConfirmationTestService.testFullConfirmationFlow(testEmail);
      updateTestState({ fullFlowResults: result });
      
      // Add individual results
      result.results.forEach(r => addResult(r));
    } catch (error) {
      addResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        testName: 'Full Confirmation Flow Test'
      });
    } finally {
      updateTestState({ isRunning: false, currentTest: '' });
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = (success: boolean) => {
    return (
      <Badge variant={success ? "default" : "destructive"}>
        {success ? 'PASS' : 'FAIL'}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Email Confirmation Test Suite</h1>
        <p className="text-muted-foreground">
          Test the email confirmation service with SMTP configuration (smtp.resend.com:2465)
        </p>
      </div>

      {/* Test Configuration */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Test Configuration
          </CardTitle>
          <CardDescription>
            Configure test parameters before running tests
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="testEmail">Test Email Address</Label>
              <Input
                id="testEmail"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@mobirides.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="testToken">Confirmation Token (for verify test)</Label>
              <Input
                id="testToken"
                value={testToken}
                onChange={(e) => setTestToken(e.target.value)}
                placeholder="Token from send test..."
              />
            </div>
          </div>
          <Button 
            onClick={clearResults} 
            variant="outline" 
            className="w-full"
            disabled={testState.isRunning}
          >
            Clear Results
          </Button>
        </CardContent>
      </Card>

      {/* Individual Tests */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Individual Tests</CardTitle>
          <CardDescription>
            Run specific email confirmation tests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={runSendTest}
              disabled={testState.isRunning}
              className="flex items-center gap-2"
            >
              {testState.currentTest === 'Send Confirmation Email' ? (
                <Clock className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send Email
            </Button>
            
            <Button
              onClick={runVerifyTest}
              disabled={testState.isRunning || !testToken.trim()}
              variant="outline"
              className="flex items-center gap-2"
            >
              {testState.currentTest === 'Verify Confirmation Token' ? (
                <Clock className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Verify Token
            </Button>
            
            <Button
              onClick={runResendTest}
              disabled={testState.isRunning}
              variant="outline"
              className="flex items-center gap-2"
            >
              {testState.currentTest === 'Resend Confirmation Email' ? (
                <Clock className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Resend Email
            </Button>
            
            <Button
              onClick={runSMTPTest}
              disabled={testState.isRunning}
              variant="outline"
              className="flex items-center gap-2"
            >
              {testState.currentTest === 'SMTP Configuration Test' ? (
                <Clock className="h-4 w-4 animate-spin" />
              ) : (
                <Settings className="h-4 w-4" />
              )}
              Test SMTP
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Full Flow Test */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Full Confirmation Flow Test
          </CardTitle>
          <CardDescription>
            Run the complete email confirmation workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={runFullFlowTest}
            disabled={testState.isRunning}
            className="w-full flex items-center gap-2"
            size="lg"
          >
            {testState.currentTest === 'Full Confirmation Flow' ? (
              <Clock className="h-5 w-5 animate-spin" />
            ) : (
              <Mail className="h-5 w-5" />
            )}
            Run Full Flow Test
          </Button>
          
          {testState.fullFlowResults && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Flow Test Summary</h4>
              <div className="flex gap-4 text-sm">
                <span>Total: {testState.fullFlowResults.summary.total}</span>
                <span className="text-green-600">Passed: {testState.fullFlowResults.summary.passed}</span>
                <span className="text-red-600">Failed: {testState.fullFlowResults.summary.failed}</span>
              </div>
              <div className="mt-2">
                {getStatusBadge(testState.fullFlowResults.success)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Results */}
      {testState.results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              Results from executed tests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testState.results.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.success)}
                      <h4 className="font-semibold">{result.testName}</h4>
                    </div>
                    {getStatusBadge(result.success)}
                  </div>
                  
                  {result.messageId && (
                    <div className="text-sm text-muted-foreground mb-1">
                      <strong>Message ID:</strong> {result.messageId}
                    </div>
                  )}
                  
                  {result.token && (
                    <div className="text-sm text-muted-foreground mb-1">
                      <strong>Token:</strong> <code className="bg-muted px-1 rounded">{result.token}</code>
                    </div>
                  )}
                  
                  {result.error && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded mt-2">
                      <strong>Error:</strong> {result.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Test Status */}
      {testState.isRunning && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <Clock className="h-4 w-4 animate-spin" />
          Running: {testState.currentTest}
        </div>
      )}
    </div>
  );
};

export default EmailConfirmationTestPage;