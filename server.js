import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { createRequire } from 'module';
import dotenv from 'dotenv';
// Import will be handled dynamically

// Load environment variables
dotenv.config();

const require = createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());



// Dynamic API route handler
app.use('/api', async (req, res) => {
  try {
    const apiPath = req.path.substring(1); // Remove leading slash
    const filePath = join(__dirname, 'api', `${apiPath}.js`);
    
    // Check if the API file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    // Handle specific endpoints
    if (apiPath === 'test/get-token') {
      // Dynamic import for test endpoint
      try {
        const handler = await import('./api/test/get-token.js');
        await handler.default(req, res);
      } catch (importError) {
        console.error('Failed to import test handler:', importError);
        res.status(500).json({ error: 'Test service unavailable' });
      }
    } else if (apiPath === 'email/confirm') {
      // Dynamic import for JavaScript file
      try {
        const { sendConfirmationEmail, verifyConfirmationToken, resendConfirmationEmail } = await import('./api/email/confirm.js');
        
        // Route based on request method and action
        if (req.method === 'POST') {
          const { action } = req.body;
          
          if (action === 'verify') {
            await verifyConfirmationToken(req, res);
          } else if (action === 'resend') {
            await resendConfirmationEmail(req, res);
          } else {
            // Default to sending confirmation email for signup
            await sendConfirmationEmail(req, res);
          }
        } else {
          res.status(405).json({ error: 'Method not allowed' });
        }
      } catch (importError) {
        console.error('Failed to import email confirm handler:', importError);
        res.status(500).json({ error: 'Email confirmation service unavailable' });
      }
    } else if (apiPath === 'auth/login') {
      // Dynamic import for auth login
      try {
        const handler = await import('./api/auth/login.js');
        await handler.default(req, res);
      } catch (importError) {
        console.error('Failed to import auth login handler:', importError);
        res.status(500).json({ error: 'Authentication service unavailable' });
      }
    } else if (apiPath === 'auth/signup') {
      // Dynamic import for auth signup
      try {
        const handler = await import('./api/auth/signup.js');
        await handler.default(req, res);
      } catch (importError) {
        console.error('Failed to import auth signup handler:', importError);
        res.status(500).json({ error: 'Signup service unavailable' });
      }
    } else if (apiPath === 'auth/forgot-password') {
      // Dynamic import for auth forgot password
      try {
        const handler = await import('./api/auth/forgot-password.js');
        await handler.default(req, res);
      } catch (importError) {
        console.error('Failed to import auth forgot password handler:', importError);
        res.status(500).json({ error: 'Forgot password service unavailable' });
      }
    } else if (apiPath === 'auth/reset-password') {
      // Dynamic import for auth reset password
      try {
        const handler = await import('./api/auth/reset-password.js');
        await handler.default(req, res);
      } catch (importError) {
        console.error('Failed to import auth reset password handler:', importError);
        res.status(500).json({ error: 'Reset password service unavailable' });
      }
    } else {
      res.status(404).json({ error: 'API endpoint not implemented' });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});