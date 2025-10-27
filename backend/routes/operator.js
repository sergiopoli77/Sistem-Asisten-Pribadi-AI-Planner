const express = require('express');
const router = express.Router();
const axios = require('axios');
const fonnte = require('../services/fonnteService');

// Helper to normalize phone numbers to '62...' (no +)
function normalizePhone(raw) {
  if (!raw) return '';
  let p = String(raw).trim();
  p = p.replace(/[^0-9+]/g, '');
  if (p.startsWith('+')) p = p.slice(1);
  if (p.startsWith('0')) p = '62' + p.slice(1);
  return p;
}

// POST /api/operator/reset-password
// Body: { nomor: string }
router.post('/reset-password', async function (req, res, next) {
  const { nomor } = req.body || {};
  if (!nomor) return res.status(400).json({ success: false, message: 'nomor required' });

  try {
    const raw = String(nomor).trim();
    const norm = normalizePhone(raw.startsWith('+') ? raw.slice(1) : raw);

    // Determine DB URL from env or fallback to devops project
    const DB_URL = process.env.FIREBASE_DATABASE_URL || 'https://devops-27a44-default-rtdb.firebaseio.com';

    // fetch all users
    const usersUrl = `${DB_URL.replace(/\/$/, '')}/users.json`;
    console.log('[operator] fetching users from', usersUrl);
    const resp = await axios.get(usersUrl, { timeout: 10000 });
    const users = resp.data || {};
    console.log('[operator] users fetched, count=', Object.keys(users).length);

    let foundUid = null;
    Object.keys(users).forEach((k) => {
      const u = users[k] || {};
      const stored = normalizePhone(u.nomor || u.phone || '');
      console.log('[operator] check user', k, 'raw=', (u.nomor||u.phone||''), 'norm=', stored);
      if (stored && stored === norm) foundUid = k;
    });

    if (!foundUid) {
      // fallback: match by last 8 digits
      const last8 = norm.slice(-8);
      console.log('[operator] no exact match, trying last8=', last8);
      Object.keys(users).forEach((k) => {
        const u = users[k] || {};
        const stored = normalizePhone(u.nomor || u.phone || '');
        if (stored && last8 && stored.endsWith(last8)) {
          foundUid = k;
          console.log('[operator] fallback matched', k, 'stored=', stored);
        }
      });
    }

    if (!foundUid) return res.status(404).json({ success: false, message: 'user not found' });

    // generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));

    // update user password via REST (DB is public per your screenshot)
    const updateUrl = `${DB_URL.replace(/\/$/, '')}/users/${foundUid}.json`;
    await axios.patch(updateUrl, { password: code, passwordUpdatedAt: new Date().toISOString() });

    // send WhatsApp via fonnte service (server uses API key from env)
    try {
      await fonnte.sendWhatsApp(norm, `Reset password Anda: ${code}`);
    } catch (notifyErr) {
      // log but still return success to caller because password updated
      console.warn('fonnte send failed:', notifyErr.message || notifyErr);
    }

    return res.json({ success: true, message: 'password reset', codeSent: !!foundUid });
  } catch (err) {
    console.error('reset-password error:', err.message || err);
    return res.status(500).json({ success: false, message: 'internal error' });
  }
});

module.exports = router;
