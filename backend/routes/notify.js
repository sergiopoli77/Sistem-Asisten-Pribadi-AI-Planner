var express = require('express');
var router = express.Router();
const fonnte = require('../services/fonnteService');

// POST /api/notify/fonnte
// Body: { to: string, message: string }
router.post('/fonnte', async function (req, res, next) {
  const { to, message } = req.body || {};
  if (!to || !message) return res.status(400).json({ error: 'to and message required' });

  try {
    const result = await fonnte.sendWhatsApp(to, message);
    res.json({ ok: true, data: result });
  } catch (err) {
    console.error('Fonnte route error:', err.message || err);
    res.status(500).json({ error: 'Fonnte service error', detail: err.message });
  }
});

module.exports = router;
