const axios = require('axios');

// Generic Fonnte WhatsApp sender wrapper.
// Expects these env vars:
// - FONNTE_API_KEY
// - FONNTE_BASE_URL

const API_KEY = process.env.FONNTE_API_KEY;
const BASE_URL = process.env.FONNTE_BASE_URL || 'https://api.fonnte.example';

if (!API_KEY) {
  console.warn('[fonnteService] FONNTE_API_KEY is not set in environment. Requests will fail until set.');
}

async function sendWhatsApp(to, message, options = {}) {
  if (!to || !message) throw new Error('to and message are required');

  const url = `${BASE_URL.replace(/\/$/, '')}/messages`;

  const payload = {
    to,
    body: message,
    // additional fields can go here depending on Fonnte API spec
    ...options.payload,
  };

  const resp = await axios.post(url, payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    timeout: options.timeout || 15000,
  });

  return resp.data;
}

module.exports = { sendWhatsApp };
