var express = require('express');
var router = express.Router();
const gemini = require('../services/geminiService');

// POST /api/ai/generate-schedule
// Body: { prompt: string, username?: string }
router.post('/generate-schedule', async function (req, res, next) {
  const { prompt, username } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'prompt required' });

  try {
    // Basic protection: limit prompt size
    if (typeof prompt === 'string' && prompt.length > 5000) {
      return res.status(400).json({ error: 'prompt too long' });
    }

    const aiResp = await gemini.generateText(prompt, { maxTokens: 600 });

    // Caller can post-process aiResp into schedule items and save to DB
    res.json({ ok: true, ai: aiResp });
  } catch (err) {
    console.error('AI route error:', err.message || err);
    res.status(500).json({ error: 'AI service error', detail: err.message });
  }
});

module.exports = router;
