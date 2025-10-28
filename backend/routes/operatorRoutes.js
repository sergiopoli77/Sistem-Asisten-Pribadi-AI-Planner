const express = require('express');
const router = express.Router();
const admin = require('../config/firebase');
const { sendWhatsappNotif } = require('../services/fonnteService');

// helper: normalize phone to international format without +, e.g. 08123 -> 628123
function normalizePhone(raw) {
  if (!raw) return '';
  let p = String(raw).trim();
  p = p.replace(/[^0-9+]/g, '');
  if (p.startsWith('+')) p = p.slice(1);
  if (p.startsWith('0')) p = '62' + p.slice(1);
  return p;
}

// POST /api/operator/reset-password
router.post('/reset-password', async (req, res) => {
  const { nomor } = req.body;
  if (!nomor) return res.status(400).json({ success: false, message: 'Nomor wajib diisi' });
  const normalizedNomor = normalizePhone(nomor);
  try {
    // Cari users dengan attribute nomor yang sama
    const ref = admin.database().ref('users');
    const snap = await ref.once('value');
    let foundKey = null;
    let operatorData = null;
    snap.forEach(child => {
      const val = child.val() || {};
      const stored = normalizePhone(val.nomor || val.phone || '');
      if (stored && (stored === normalizedNomor || stored.endsWith(normalizedNomor) || normalizedNomor.endsWith(stored) || stored.slice(-8) === normalizedNomor.slice(-8))) {
        foundKey = child.key;
        operatorData = val;
      }
    });
    if (!foundKey) {
      return res.status(404).json({ success: false, message: 'Nomor tidak ditemukan di operator' });
    }
  // Generate password baru (6 digit random)
  const newPassword = Math.floor(100000 + Math.random() * 900000).toString();
  // Safety: log exactly which user key we're updating to avoid accidentally creating new nodes
  console.log('[operator] updating user password for key=', foundKey, 'path=users/' + foundKey);
  await ref.child(foundKey).update({ password: newPassword, passwordUpdatedAt: new Date().toISOString() });
    // Kirim notifikasi WhatsApp
    const pesan = `Reset Password!\n\nThis is your new password.\n\n========== Credentials ==========\n\nAccount Number: ${nomor}\nPassword: ${newPassword}\n\n==============================\nPlease change the password after login to secure your account.\n\nThank you!`;
    try {
      await sendWhatsappNotif(normalizedNomor, pesan);
    } catch (e) {
      return res.status(200).json({ success: true, message: 'Password berhasil direset, tapi notifikasi WhatsApp gagal dikirim.', password: newPassword });
    }
    return res.json({ success: true, message: 'Password berhasil direset dan notifikasi dikirim.', password: newPassword });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

module.exports = router;
