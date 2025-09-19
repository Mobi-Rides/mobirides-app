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
    const filePath = join(__dirname, 'api', `${apiPath}.ts`);
    
    // Check if the API file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    // Handle specific endpoints
    if (apiPath === 'email/confirm') {
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