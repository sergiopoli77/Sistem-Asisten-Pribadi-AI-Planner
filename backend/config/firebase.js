const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Prefer explicit env override for service account path
const SERVICE_ACCOUNT_PATH = process.env.SERVICE_ACCOUNT_PATH || path.join(__dirname, 'serviceAccountKey.json');
const DB_URL = process.env.FIREBASE_DATABASE_URL || 'https://devops-27a44-default-rtdb.firebaseio.com';

let admin;
try {
  // attempt to load firebase-admin only if service account file is present
  if (fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    admin = require('firebase-admin');
    const serviceAccount = require(SERVICE_ACCOUNT_PATH);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: DB_URL,
    });
    module.exports = admin;
  } else {
    // Fallback: create a tiny client that uses Realtime Database REST API
    console.warn('[firebase] serviceAccount not found at', SERVICE_ACCOUNT_PATH, '— falling back to REST client. This requires your RTDB to allow public access or have a valid auth token.');

    const client = {
      database() {
        return {
          ref: (refPath) => {
            const prefix = refPath.replace(/^\/+/, '');
            return {
              async once(event) {
                // only support 'value'
                const url = `${DB_URL.replace(/\/$/, '')}/${prefix}.json`;
                const resp = await axios.get(url, { timeout: 10000 });
                return {
                  val: () => resp.data,
                  forEach: (cb) => {
                    const data = resp.data || {};
                    Object.keys(data).forEach((k) => {
                      const child = { key: k, val: () => data[k] };
                      cb(child);
                    });
                  },
                };
              },
              child(subPath) {
                const childPrefix = `${prefix}/${subPath}`.replace(/\/+/, '');
                return {
                  update: async (obj) => {
                    const url = `${DB_URL.replace(/\/$/, '')}/${childPrefix}.json`;
                    await axios.patch(url, obj, { timeout: 10000 });
                  },
                };
              },
            };
          },
        };
      },
    };

    module.exports = client;
  }
} catch (err) {
  // If something goes wrong, surface a clear message
  console.error('[firebase] initialization error:', err && err.message ? err.message : err);
  throw err;
}
