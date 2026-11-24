const express = require('express');
const cors = require('cors');
require('dotenv').config();

const apiRouter = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

// Root & Health check
app.get('/', (req, res) => {
  res.json({
    project: 'Akshaya Patra Food Distribution Management System',
    version: '1.0.0',
    status: 'ONLINE',
    database: 'PostgreSQL 16 (akshaya_patra_db)',
    timestamp: new Date().toISOString()
  });
});

// Mount API routes
app.use('/api', apiRouter);

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Akshaya Patra Backend API running on http://localhost:${PORT}`);
});

module.exports = { app, server };
