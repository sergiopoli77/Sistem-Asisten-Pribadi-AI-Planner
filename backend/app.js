// backend/app.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import router AI
const aiRouter = require('./routes/ai');
const operatorRouter = require('./routes/operator');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/ai', aiRouter);
console.log('[DEBUG] /api/ai route registered');
app.use('/api/operator', operatorRouter);
console.log('[DEBUG] /api/operator route registered');


// Root test endpoint
app.get('/', (req, res) => {
  res.send('🚀 AI Planner Backend is running');
});

// 404 handler
app.use((req, res) => {
  res.status(404).send('Not Found');
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// ✅ Jangan jalankan app.listen() di sini
module.exports = app;

