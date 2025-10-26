// backend/services/geminiService.js
const axios = require("axios");

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash"; // default aman

if (!API_KEY) {
  console.warn(
    "[geminiService] ⚠️ GEMINI_API_KEY is not set in environment. Requests will fail until configured."
  );
}

// Base URL Gemini API
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

/**
 * Generate text from Gemini
 * @param {string} prompt
 * @param {object} options
 * @returns {Promise<{text: string, raw: object}>}
 */
async function generateText(prompt, options = {}) {
  if (!prompt) throw new Error("prompt is required");
  if (!API_KEY) throw new Error("GEMINI_API_KEY not configured");

  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: options.temperature ?? 0.6,
      maxOutputTokens: options.maxOutputTokens ?? 700,
    },
  };

  try {
    console.log(`[GeminiService] 🧠 Generating text with model: ${MODEL}`);
    console.log(`[GeminiService] Prompt:`, prompt);

    const response = await axios.post(BASE_URL, body, {
      headers: { "Content-Type": "application/json" },
      timeout: options.timeout || 20000,
    });

    const data = response.data;
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    console.log("[GeminiService] ✅ Response received");
    return { text, raw: data };
  } catch (error) {
    if (error.response) {
      console.error(
        `[GeminiService] ❌ API error ${error.response.status}:`,
        JSON.stringify(error.response.data, null, 2)
      );
    } else {
      console.error("[GeminiService] ❌ Error:", error.message);
    }
    throw error;
  }
}

/**
 * List all available Gemini models
 */
async function listModels() {
  if (!API_KEY) throw new Error("GEMINI_API_KEY not configured");

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
  console.log("[GeminiService] 🔍 Listing models...");

  const response = await axios.get(url, { timeout: 10000 });
  return response.data;
}

module.exports = { generateText, listModels };
