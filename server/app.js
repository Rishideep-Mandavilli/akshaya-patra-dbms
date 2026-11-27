const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const apiRouter = require('./routes/api');

const app = express();

app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    if (process.env.NODE_ENV !== 'test') {
      console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`);
    }
  });
  next();
});

// Mount API routes
app.use('/api', apiRouter);

// Health check endpoint
app.get('/api-health', (req, res) => {
  res.json({
    project: 'Akshaya Patra Food Distribution Management System',
    version: '1.0.0',
    status: 'ONLINE',
    database: 'PostgreSQL (akshaya_patra_db)',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend static assets in production/standalone environments
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

// Fallback to index.html for client-side routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(clientDistPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) next();
  });
});

module.exports = app;
