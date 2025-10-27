import React, { useState } from 'react';
import { normalizePhone } from '../utils/phone';
import '../assets/GantiPassword.css';

function LupaPassword() {
  const [account, setAccount] = useState('');
  const [country, setCountry] = useState('62');
  const [loading, setLoading] = useState(false);
  const [notif, setNotif] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setNotif('');

    try {
      const raw = (account || '').trim();
      const combined = raw.startsWith('+') ? raw.slice(1) : raw;
      const norm = normalizePhone(combined);
      console.log('[ForgotPassword] requesting server reset for phone=', norm);

      const serverUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:4000/api/operator/reset-password'
        : window.location.protocol + '//' + window.location.hostname + '/api/operator/reset-password';

      const resp = await fetch(serverUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nomor: norm }),
      });

      const json = await resp.json();
      if (!resp.ok) {
        console.warn('[ForgotPassword] server responded error', json);
        setNotif('User dengan nomor tersebut tidak ditemukan.');
        setLoading(false);
        setTimeout(() => setNotif(''), 3000);
        return;
      }

      setNotif('Password berhasil direset! Silakan cek WhatsApp Anda.');
    } catch (err) {
      console.error('Reset error:', err);
      setNotif('Gagal reset password!');
    }

    setLoading(false);
    setTimeout(() => setNotif(''), 3000);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f7f9fb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {notif && (
        <div style={{position:'fixed',top:30,right:30,zIndex:2000,background:'#4b9960',color:'#fff',padding:'16px 32px',borderRadius:10,boxShadow:'0 4px 16px #0002',fontWeight:600,fontSize:17,letterSpacing:0.2}}>
          {notif}
        </div>
      )}
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px #0001', padding: 40, minWidth: 400, maxWidth: 420 }}>
        <div style={{ marginBottom: 24 }}>
          <a href="/" style={{ color: '#22314a', textDecoration: 'none', fontWeight: 500, fontSize: 15 }}>&larr; Back to log in</a>
        </div>
        <h2 style={{ fontWeight: 700, fontSize: 32, marginBottom: 8 }}>Forgot your password?</h2>
        <div style={{ color: '#555', fontSize: 17, marginBottom: 32 }}>Masukkan nomor WhatsApp yang terdaftar. Kami akan mengirimkan password baru (6 digit) melalui WhatsApp.</div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e0e0e0', borderRadius: 8, padding: '8px 12px', background: '#fafbfc' }}>
              <span style={{ marginRight: 8, color: '#888' }}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 19.25v-.5A4.75 4.75 0 019.25 14h5.5a4.75 4.75 0 014.75 4.75v.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
              <input
                type="text"
                value={account}
                onChange={e => setAccount(e.target.value.replace(/[^0-9+]/g, ''))}
                placeholder="628xxxxxxxxxx"
                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 16, flex: 1 }}
                required
              />
            </div>
          </div>
          <div style={{ marginBottom: 28 }}>
            <label style={{ fontWeight: 500, fontSize: 16, marginBottom: 6, display: 'block' }}>Country</label>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e0e0e0', borderRadius: 8, padding: '8px 12px', background: '#fafbfc' }}>
              <span style={{ marginRight: 8 }}>
                <img src="https://flagcdn.com/id.svg" alt="ID" width={24} style={{ borderRadius: 4 }} />
              </span>
              <select value={country} onChange={e => setCountry(e.target.value)} style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 16, flex: 1 }}>
                <option value="62">Indonesia (+62)</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', background: '#22314a', color: '#fff', fontWeight: 600, fontSize: 17, border: 'none', borderRadius: 8, padding: '12px 0', marginBottom: 8, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Processing...' : 'Recover password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LupaPassword;

//testing forgot password page