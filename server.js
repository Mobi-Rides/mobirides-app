import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Helper to handle async routes
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

app.use('/api', async (req, res) => {
  const apiPath = req.url.replace(/^\//, ''); // Remove leading slash
  console.log(`[Server] API Request: ${req.method} ${apiPath}`);
  console.log(`[Server] Request headers:`, req.headers['content-type']);
  console.log(`[Server] Request body:`, req.body);

  try {
    let handler;
    // Map paths to files
    if (apiPath === 'auth/login') {
      console.log('[Server] Routing to auth/login.js');
      handler = await import('./api/auth/login.js');
    } else if (apiPath === 'auth/signup') {
      console.log('[Server] Routing to auth/signup.js');
      handler = await import('./api/auth/signup.js');
    } else if (apiPath === 'auth/forgot-password') {
      console.log('[Server] Routing to auth/forgot-password.js');
      handler = await import('./api/auth/forgot-password.js');
    } else if (apiPath === 'auth/reset-password') {
      console.log('[Server] Routing to auth/reset-password.js');
      handler = await import('./api/auth/reset-password.js');
    } else if (apiPath === 'notifications/booking-confirmation') {
      console.log('[Server] Routing to notifications/booking-confirmation.js');
      handler = await import('./api/notifications/booking-confirmation.js');
    } else if (apiPath && typeof apiPath === 'string' && apiPath.startsWith('admin/')) {
      // Admin routes temporarily disabled due to missing files/merge conflict
      console.warn(`[Server] Admin route ${apiPath} requested but admin handlers are missing.`);
      return res.status(503).json({ error: 'Admin services temporarily unavailable' });
    } else {
      console.warn(`[Server] Route not found: ${apiPath}`);
      return res.status(404).json({ error: 'Route not found' });
    }

    if (handler && handler.default) {
      console.log(`[Server] Handler found for ${apiPath}, executing...`);
      await handler.default(req, res);
    } else {
      console.error(`[Server] Invalid handler export for ${apiPath}`);
      res.status(500).json({ error: 'Invalid handler export' });
    }
  } catch (error) {
    console.error(`[Server] Error handling ${apiPath}:`, error);
    console.error(`[Server] Error stack:`, error.stack);
    // If module not found
    if (error.code === 'ERR_MODULE_NOT_FOUND') {
      return res.status(404).json({ error: 'Handler not found', details: error.message });
    }
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

app.listen(port, () => {
  console.log('='.repeat(50));
  console.log(`🚀 API Server running on port ${port}`);
  console.log('='.repeat(50));
  console.log('Available routes:');
  console.log('  - POST /api/auth/login');
  console.log('  - POST /api/auth/signup');
  console.log('  - POST /api/auth/forgot-password');
  console.log('  - POST /api/auth/reset-password');
  console.log('  - POST /api/notifications/booking-confirmation');
  console.log('='.repeat(50));
});
