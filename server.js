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

// Handler function for resend test endpoint
async function handleResendTest(req, res) {
  try {
    const { type, to, subject, templateId, dynamicData, html } = req.body;

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return res.status(200).json({ message: 'OK' });
    }

    switch (type) {
      case 'config':
        return res.json({
          templates: 0,
          functionAvailable: false,
          apiKeyConfigured: !!process.env.RESEND_API_KEY,
          fromEmailConfigured: !!process.env.RESEND_FROM_EMAIL,
          environment: 'local-development'
        });

      case 'basic':
        // Mock basic email response
        return res.json({
          success: true,
          messageId: `mock-${Date.now()}-basic`,
          message: 'Basic email sent successfully (mock)'
        });

      case 'template':
        // Mock template email response
        return res.json({
          success: true,
          messageId: `mock-${Date.now()}-template`,
          message: 'Template email sent successfully (mock)',
          templateId: templateId || 'welcome-renter'
        });

      case 'confirmation':
        // Mock confirmation email response
        return res.json({
          success: true,
          messageId: `mock-${Date.now()}-confirmation`,
          message: 'Confirmation email sent successfully (mock)'
        });

      case 'booking':
        // Mock booking email response
        return res.json({
          success: true,
          messageId: `mock-${Date.now()}-booking`,
          message: 'Booking notification sent successfully (mock)'
        });

      default:
        return res.status(400).json({
          error: 'Invalid email type',
          validTypes: ['config', 'basic', 'template', 'confirmation', 'booking']
        });
    }
  } catch (error) {
    console.error('Resend test error:', error);
    return res.status(500).json({
      error: 'Failed to process email request',
      details: error.message
    });
  }
}

// Dynamic API route handler
app.use('/api', async (req, res) => {
  try {
    const apiPath = req.path.substring(1); // Remove leading slash
    const filePath = join(__dirname, 'api', `${apiPath}.ts`);
    
    // Check if the API file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    // Handle specific endpoints
    if (apiPath === 'test/resend') {
      await handleResendTest(req, res);
    } else if (apiPath === 'email/confirm') {
      // Dynamic import for JavaScript file
      try {
        const { default: emailConfirmHandler } = await import('./api/email/confirm.js');
        await emailConfirmHandler(req, res);
      } catch (importError) {
        console.error('Failed to import email confirm handler:', importError);
        res.status(500).json({ error: 'Email confirmation service unavailable' });
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