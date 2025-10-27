const axios = require('axios');
require('dotenv').config();

const FONNTE_API_KEY = process.env.FONNTE_API_KEY;

if (!FONNTE_API_KEY) {
  // Do not throw on require time in all environments; export a function that will
  // throw if attempted to be used without configuration.
  // However keep a helpful console warning so devs notice missing config.
  console.warn('[sendMessage] FONNTE_API_KEY is not defined in .env. Real sending will fail until set.');
}

async function sendWhatsAppMessage(to, message) {
  if (!FONNTE_API_KEY) {
    throw new Error('FONNTE_API_KEY is not defined in the .env file. Please add it.');
  }

  try {
    const response = await axios.post('https://api.fonnte.com/send', {
      target: to,
      message: message,
    }, {
      headers: {
        // Using the header format from your example. If the provider expects
        // `Bearer <token>` change this to `Authorization: `Bearer ${FONNTE_API_KEY}``.
        Authorization: FONNTE_API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 20000,
    });

    console.log('[sendMessage] Pesan berhasil dikirim:', response.data);
    return response.data;

  } catch (error) {
    console.error('[sendMessage] Gagal mengirim pesan:', error.response ? error.response.data : error.message);
    throw error;
  }
}

module.exports = { sendWhatsAppMessage };
