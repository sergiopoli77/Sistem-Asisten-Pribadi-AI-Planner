// services/fonnteService.js
// Service untuk mengirim WhatsApp via Fonnte

const axios = require('axios');

const FONNTE_API_KEY = process.env.FONNTE_API_KEY; // simpan API key di .env
const FONNTE_BASE = process.env.FONNTE_BASE_URL || 'https://api.fonnte.com';
// choose endpoint path depending on base: mock server expects /messages, real provider uses /send
const FONNTE_URL = (FONNTE_BASE.replace(/\/$/, '') + (FONNTE_BASE.includes('localhost') || FONNTE_BASE.includes(':5000') ? '/messages' : '/send'));

/**
 * Kirim pesan WhatsApp via Fonnte
 * @param {string} phone - Nomor HP tujuan (format internasional, tanpa +)
 * @param {string} message - Isi pesan
 * @returns {Promise<object>} Hasil response dari Fonnte
 */
async function sendWhatsappNotif(phone, message) {
  if (!FONNTE_API_KEY) throw new Error('FONNTE_API_KEY belum di-set di .env');
  if (!phone || !message) throw new Error('Nomor HP dan pesan wajib diisi');
  try {
    const authScheme = process.env.FONNTE_AUTH_SCHEME || 'Bearer';
    const authHeader = `${authScheme} ${FONNTE_API_KEY}`.trim();
    const res = await axios({
      method: 'post',
      url: FONNTE_URL,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      data: {
        target: phone,
        message: message,
        countryCode: '62', // default Indonesia
      }
    });
    return res.data;
  } catch (err) {
    const details = err.response ? { status: err.response.status, data: err.response.data } : { message: err.message };
    const e = new Error('Fonnte send failed');
    e.details = details;
    throw e;
  }
}

module.exports = { sendWhatsappNotif };
