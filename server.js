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

app.all('/api/{*path}', async (req, res) => {
  const apiPath = req.params.path;
  console.log(`API Request: ${apiPath}`);

  try {
    let handler;
    // Map paths to files
    if (apiPath === 'auth/login') {
      handler = await import('./api/auth/login.js');
    } else if (apiPath === 'auth/signup') {
      handler = await import('./api/auth/signup.js');
    } else if (apiPath === 'auth/forgot-password') {
      handler = await import('./api/auth/forgot-password.js');
    } else if (apiPath === 'auth/reset-password') {
      handler = await import('./api/auth/reset-password.js');
    } else if (apiPath === 'notifications/booking-confirmation') {
      handler = await import('./api/notifications/booking-confirmation.js');
    } else if (apiPath.startsWith('admin/')) {
      // Admin routes temporarily disabled due to missing files/merge conflict
      console.warn(`Admin route ${apiPath} requested but admin handlers are missing.`);
      return res.status(503).json({ error: 'Admin services temporarily unavailable' });
    } else {
      console.warn(`Route not found: ${apiPath}`);
      return res.status(404).json({ error: 'Route not found' });
    }

    if (handler && handler.default) {
      await handler.default(req, res);
    } else {
      res.status(500).json({ error: 'Invalid handler export' });
    }
  } catch (error) {
    console.error(`Error handling ${apiPath}:`, error);
    // If module not found
    if (error.code === 'ERR_MODULE_NOT_FOUND') {
      return res.status(404).json({ error: 'Handler not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`API Server running on port ${port}`);
});
