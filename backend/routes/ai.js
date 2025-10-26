// backend/routes/ai.js
const express = require('express');
const router = express.Router();
const geminiService = require('../services/geminiService');

// POST /api/ai/generate-schedule
router.post('/generate-schedule', async (req, res) => {
  const { prompt, history } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'prompt is required in request body' });
  }

  // Build a combined prompt including recent conversation history so the model
  // can respond with proper context. History is expected to be an array of
  // { sender: 'user'|'ai', text: '...' } objects. We'll format it into a simple
  // chat transcript followed by the new user prompt.
  let combinedPrompt = 'Anda adalah AI Planner Assistant yang membantu membuat jadwal dan menjawab pertanyaan pengguna. Gunakan konteks percakapan sebelumnya untuk menjawab dengan tepat.\n\n';

  if (Array.isArray(history) && history.length) {
    combinedPrompt += 'Percakapan sebelumnya:\n';
    history.forEach((m) => {
      const who = (m.sender === 'user') ? 'User' : 'Assistant';
      combinedPrompt += `${who}: ${m.text}\n`;
    });
    combinedPrompt += '\n';
  }

  combinedPrompt += `User: ${prompt}\nAssistant:`;

  try {
    const ai = await geminiService.generateText(combinedPrompt, {
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

//222