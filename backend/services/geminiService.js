const axios = require('axios');

// Simple wrapper for Google Generative Language (Gemini) HTTP API.
// Requires these env vars:
// - GOOGLE_API_KEY
// - GEMINI_MODEL (optional)

const MODEL = process.env.GEMINI_MODEL || 'models/text-bison-001';
const API_KEY = process.env.GOOGLE_API_KEY;

if (!API_KEY) {
  console.warn('[geminiService] GOOGLE_API_KEY is not set in environment. Requests will fail until set.');
}

async function generateText(prompt, options = {}) {
  if (!prompt) throw new Error('prompt is required');
  const url = `https://generativelanguage.googleapis.com/v1beta2/${MODEL}:generateText?key=${API_KEY}`;

  const body = {
    prompt: { text: prompt },
    temperature: typeof options.temperature === 'number' ? options.temperature : 0.2,
    maxOutputTokens: options.maxTokens || 512,
  };

  const resp = await axios.post(url, body, {
    headers: { 'Content-Type': 'application/json' },
    timeout: options.timeout || 30000,
  });

  // Return raw response for caller to adapt/post-process
  return resp.data;
}

module.exports = { generateText };
