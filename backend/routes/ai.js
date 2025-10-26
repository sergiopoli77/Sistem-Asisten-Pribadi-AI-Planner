// backend/routes/ai.js
const express = require('express');
const router = express.Router();
const geminiService = require('../services/geminiService');

// POST /api/ai/generate-schedule
router.post('/generate-schedule', async (req, res) => {
  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'prompt is required in request body' });
  }

  try {
    const ai = await geminiService.generateText(prompt, {
      temperature: 0.3,
      maxOutputTokens: 700,
    });

    return res.json({ ai });
  } catch (err) {
    console.error('[ai.generate-schedule] error', err.message || err);
    return res.status(500).json({ error: 'AI service error', details: err.message });
  }
});

// GET /api/ai/models
router.get('/models', async (req, res) => {
  try {
    const list = await geminiService.listModels({ timeout: 10000 });
    return res.json({ models: list });
  } catch (err) {
    console.error('[ai.list-models] error', err.message || err);
    return res.status(500).json({ error: 'Models list error', details: err.message });
  }
});

// GET /api/ai/ping
router.get('/ping', (req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

module.exports = router;
