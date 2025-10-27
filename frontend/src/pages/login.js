import React, { useState } from 'react';
import { Brain, Mail, Lock, Sparkles, ArrowRight } from 'lucide-react';
import { db } from '../config/firebase';
import { ref, get } from 'firebase/database';
import '../assets/login.css';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [focusedField, setFocusedField] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError('');
    setLoading(true);

    const name = username.trim();
    if (!name || !password) {
      setError('Username dan password wajib diisi!');
      setLoading(false);
      return;
    }

    try {
      const usersRef = ref(db, 'users');
      const snap = await get(usersRef);

      if (!snap.exists()) {
        setError('User tidak ditemukan.');
        setLoading(false);
        return;
      }

      let userRecord = null;
      let uid = null;

      // cari user berdasarkan nama (case-insensitive)
      snap.forEach((child) => {
        const data = child.val();
        if (
          data.nama &&
          data.nama.toLowerCase().trim() === name.toLowerCase().trim()
        ) {
          userRecord = data;
          uid = child.key;
        }
      });

      if (!userRecord) {
        setError('User tidak ditemukan.');
        setLoading(false);
        return;
      }

      // validasi password
      if (String(userRecord.password).trim() === String(password).trim()) {
        const displayName = userRecord.nama || name;
        const userRole = userRecord.role ? userRecord.role.toLowerCase() : 'user';

        // simpan data singkat ke localStorage agar protected pages yang
        // membaca localStorage (mis. `Profile.js`, `ChatAI.js`) mengenali user
        try {
          localStorage.setItem('username', uid); // uid digunakan sebagai key di RTDB: users/{uid}
          localStorage.setItem('displayName', displayName);
          localStorage.setItem('role', userRole);
        } catch (e) {
          console.warn('Gagal menyimpan ke localStorage:', e);
        }

        // kirim hasil login ke parent (App.js)
        if (onLogin) onLogin({ username: displayName, role: userRole, uid });
        alert(`Login berhasil! Selamat datang, ${displayName}.`);
        setLoading(false);
        return;
      }

      setError('Password salah.');
      setLoading(false);
    } catch (err) {
      console.error('Login RTDB error:', err);
      setError('Terjadi error saat verifikasi. Cek koneksi Anda.');
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Animated background */}
      <div className="blob blob-left"></div>
      <div className="blob blob-right"></div>

      {/* Login card */}
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="header-icon">
            <Brain className="brain-icon" strokeWidth={2.5} />
          </div>
          <h1>AI Planner</h1>
          <div className="header-subtitle">
            <Sparkles className="sparkle" />
            <span>Asisten Pribadi Cerdas Anda</span>
            <Sparkles className="sparkle" />
          </div>
        </div>

        {/* Form */}
        <form className="login-body" onSubmit={handleSubmit}>
          <h2>Selamat Datang Kembali! 👋</h2>
          <p>Masuk untuk mengatur jadwal Anda</p>

          {error && <div className="error-box">{error}</div>}

          {/* Username */}
          <div className="form-group">
            <label>Username</label>
            <div className="input-wrapper">
              <Mail
                className={`input-icon ${
                  focusedField === 'username' ? 'focused' : ''
                }`}
              />
              <input
                type="text"
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setFocusedField('username')}
                onBlur={() => setFocusedField('')}
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label>Password</label>
            <div className="input-wrapper">
              <Lock
                className={`input-icon ${
                  focusedField === 'password' ? 'focused' : ''
                }`}
              />
              <input
                type="password"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField('')}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (
              <>
                <div className="spinner"></div>
                <span>Memeriksa...</span>
              </>
            ) : (
              <>
                <span>Masuk</span>
                <ArrowRight className="arrow-icon" />
              </>
            )}
          </button>

          {/* Register link */}
          <div className="register-link">
            Belum punya akun? <a href="/signup">Daftar di sini →</a>
          </div>
          {/* Forgot password link */}
          <div className="forgot-link" style={{ marginTop: '8px' }}>
            <a href="/forgot">Lupa password?</a>
          </div>
        </form>

        {/* Footer */}
        <div className="login-footer">
          <p>© 2025 AI Planner. Semua hak dilindungi.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
