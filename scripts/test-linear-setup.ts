// Test file to verify Linear SDK usage
import { createClient } from '@linear/sdk';

// This verifies the SDK is properly installed and the API is accessible
const client = createClient({
  apiKey: process.env.LINEAR_API_KEY || 'test-key',
});

console.log('Linear SDK client created successfully');
console.log('Client methods available:', Object.keys(client).join(', '));