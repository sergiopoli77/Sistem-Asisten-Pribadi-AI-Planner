const express = require('express');
const bodyParser = require('body-parser');

// Simple local mock of Fonnte-compatible API for development.
// Listens on port 5000 and accepts POST /messages

const app = express();
app.use(bodyParser.json());

app.post('/messages', (req, res) => {
  console.log('[mock-fonnte] received POST /messages payload:', JSON.stringify(req.body));
  // simulate a provider response
  return res.json({ success: true, provider: 'mock-fonnte', received: req.body });
});

const port = process.env.MOCK_FONNTE_PORT || 5000;
app.listen(port, () => {
  console.log(`[mock-fonnte] Mock Fonnte listening on http://localhost:${port}`);
});

module.exports = app;
