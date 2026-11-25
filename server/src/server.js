import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { config } from './config.js';
import { connectDB } from './db.js';
import { router as apiRouter } from './routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', apiRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend build if available (single unified server)
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(clientDistPath, 'index.html'));
    }
    next();
  });
}

export { app };

// Auto-start server when run directly
if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`\n==================================================`);
    console.log(`  Date-Wise Statement Tracker is running!`);
    console.log(`  Local URL: http://localhost:${config.port}`);
    console.log(`==================================================\n`);
  });

  connectDB().catch((err) => {
    console.warn('MongoDB connection pending / retrying:', err.message);
  });
}
