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
    // prepare variants for incoming norm to make matching more tolerant
    const normVariants = new Set();
    normVariants.add(norm);
    normVariants.add(norm.replace(/^62/, ''));
    normVariants.add(norm.replace(/^0/, ''));
    // also add last 8 and 9 digits as fallbacks
    if (norm.length >= 8) normVariants.add(norm.slice(-8));
    if (norm.length >= 9) normVariants.add(norm.slice(-9));

    console.log('[operator] matching variants for incoming nomor=', norm, Array.from(normVariants));

    Object.keys(users).forEach((k) => {
      const u = users[k] || {};
      const rawStored = (u.nomor || u.phone || '');
      const stored = normalizePhone(rawStored);
      const storedVariants = new Set([stored, stored.replace(/^62/, ''), stored.replace(/^0/, ''), stored.slice(-8), stored.slice(-9)]);
      console.log('[operator] check user', k, 'raw=', rawStored, 'norm=', stored, 'variants=', Array.from(storedVariants));

      // exact match on any normalized variant
      for (const v of normVariants) {
        if (!v) continue;
        if (stored === v || stored.endsWith(v) || v.endsWith(stored) || storedVariants.has(v)) {
          foundUid = k;
          break;
        }
      }
      if (foundUid) return;
    });

    if (!foundUid) return res.status(404).json({ success: false, message: 'user not found' });

    // generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));

    // update user password via REST (DB is public per your screenshot)
    const updateUrl = `${DB_URL.replace(/\/$/, '')}/users/${foundUid}.json`;
    await axios.patch(updateUrl, { password: code, passwordUpdatedAt: new Date().toISOString() });

    // send WhatsApp via fonnte service (server uses API key from env)
    try {
      const userObj = users[foundUid] || {};
      const displayName = userObj.nama || userObj.name || foundUid;
      const waMessage = `Halo ${displayName},\n\nPassword akun Anda di *AI Planner* telah direset oleh sistem.\n\nPassword sementara Anda: *${code}*\n\nJangan bagikan password atau kode ini kepada siapapun. Setelah masuk, segera ubah password Anda di menu Profil untuk keamanan.\n\nJika Anda tidak meminta reset ini, silakan abaikan pesan ini atau hubungi tim dukungan.`;

      const sendResult = await fonnte.sendWhatsApp(norm, waMessage);
      console.log('[operator] fonnte send result:', sendResult && (sendResult.success !== undefined ? sendResult : JSON.stringify(sendResult)).toString());
    } catch (notifyErr) {
      // log but still return success to caller because password updated
      console.warn('fonnte send failed:', notifyErr.message || notifyErr);
      // if we wrapped an axios error in fonnteService, show deeper details to help debugging
      try {
        if (notifyErr.original) {
          const o = notifyErr.original;
          const respData = o.response ? o.response.data : undefined;
          console.warn('fonnte original error message:', o.message || o);
          if (respData) console.warn('fonnte original response data:', respData);
        }
      } catch (e) {
        // ignore
      }
    }

    return res.json({ success: true, message: 'password reset', codeSent: !!foundUid });
  } catch (err) {
    console.error('reset-password error:', err.message || err);
    return res.status(500).json({ success: false, message: 'internal error' });
  }
});

module.exports = router;

// Legacy-compatible route: mirror older system behavior which stored operators under /operator
// POST /api/operator/reset-password-legacy
// Body: { nomor: '62895396383827' }
router.post('/reset-password-legacy', async function (req, res, next) {
  const { nomor } = req.body || {};
  if (!nomor) return res.status(400).json({ success: false, message: 'nomor required' });

  try {
    const raw = String(nomor).trim();
    const norm = normalizePhone(raw.startsWith('+') ? raw.slice(1) : raw);

    const DB_URL = process.env.FIREBASE_DATABASE_URL || 'https://devops-27a44-default-rtdb.firebaseio.com';
    const operatorsUrl = `${DB_URL.replace(/\/$/, '')}/operator.json`;
    console.log('[operator-legacy] fetching operators from', operatorsUrl);
    const resp = await axios.get(operatorsUrl, { timeout: 10000 });
    const operators = resp.data || {};

    let foundKey = null;
    let operatorData = null;
    Object.keys(operators).forEach((k) => {
      const v = operators[k] || {};
      const stored = normalizePhone(v.nomor || v.phone || '');
      if (stored && stored === norm) {
        foundKey = k;
        operatorData = v;
      }
    });

    if (!foundKey) return res.status(404).json({ success: false, message: 'Nomor tidak ditemukan di operator' });

    const newPassword = String(Math.floor(100000 + Math.random() * 900000));
    const updateUrl = `${DB_URL.replace(/\/$/, '')}/operator/${foundKey}.json`;
    await axios.patch(updateUrl, { password: newPassword, passwordUpdatedAt: new Date().toISOString() });

    // send notification
    try {
      const displayName = (operatorData && (operatorData.nama || operatorData.name)) || foundKey;
      const message = `Halo ${displayName},\n\nPassword akun Anda telah direset.\n\nPassword sementara: *${newPassword}*\n\nJangan bagikan password ini. Segera ubah password setelah login.`;
      const sendResult = await fonnte.sendWhatsApp(norm, message);
      console.log('[operator-legacy] fonnte send result:', sendResult);
    } catch (notifyErr) {
      console.warn('[operator-legacy] fonnte send failed:', notifyErr.message || notifyErr);
      try {
        if (notifyErr.original) {
          const o = notifyErr.original;
          const respData = o.response ? o.response.data : undefined;
          console.warn('[operator-legacy] fonnte original error message:', o.message || o);
          if (respData) console.warn('[operator-legacy] fonnte original response data:', respData);
        }
      } catch (e) {}
      return res.status(200).json({ success: true, message: 'Password berhasil direset, tapi notifikasi WhatsApp gagal dikirim.', password: newPassword });
    }

    return res.json({ success: true, message: 'Password berhasil direset dan notifikasi dikirim.', password: newPassword });
  } catch (err) {
    console.error('reset-password-legacy error:', err.message || err);
    return res.status(500).json({ success: false, message: 'internal error' });
  }
});
