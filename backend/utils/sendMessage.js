// /utils/sendMessage.js
// respon dari sistem
const axios = require('axios');
require('dotenv').config();

const FONNTE_API_KEY = process.env.FONNTE_API_KEY;

if (!FONNTE_API_KEY) {
    throw new Error("FONNTE_API_KEY is not defined in the .env file. Please add it.");
}

async function sendWhatsAppMessage(to, message) {
    try {
        const response = await axios.post('https://api.fonnte.com/send', {
            target: to,       // Nomor tujuan, contoh: 628123456789
            message: message  // Isi pesan
        }, {
            headers: {
                'Authorization': FONNTE_API_KEY
            }
        });

        console.log('Pesan berhasil dikirim:', response.data);
        return response.data;

    } catch (error) {
        console.error('Gagal mengirim pesan:', error.response ? error.response.data : error.message);
        throw error;
    }
}

module.exports = { sendWhatsAppMessage };
