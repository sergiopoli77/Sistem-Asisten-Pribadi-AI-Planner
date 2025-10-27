import React, { useState } from 'react';
import '../assets/Signup.css';
import { Brain, Mail, Lock, Phone, User, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';
import { db } from '../config/firebase';
import { ref, set, get } from 'firebase/database';

const Signup = () => {
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [focusedField, setFocusedField] = useState('');

  const normalizeKey = (name) => {
    return name.trim().toLowerCase().replace(/\s+/g, '');
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    // 🔍 Validasi dasar
    if (!nama || !email || !phone || !password || !confirmPassword) {
      setError('Semua field wajib diisi!');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok!');
      return;
    }

    if (password.length < 6) {
      setError('Password minimal 6 karakter!');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Format email tidak valid!');
      return;
    }

    if (phone.length < 10) {
      setError('Nomor WhatsApp minimal 10 digit!');
      return;
    }

    setLoading(true);

    try {
      const userKey = normalizeKey(nama);
      const userRef = ref(db, `users/${userKey}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        setError('Nama pengguna sudah terdaftar!');
        setLoading(false);
        return;
      }

      // ✅ Simpan data ke Firebase
      await set(userRef, {
        nama: nama.trim(),
        email: email.trim(),
        nomor: phone.trim(),
        password: password.trim(),
        jenisKelamin: 'Belum diisi',
        createdAt: Date.now(),
      });

      setSuccess('Akun berhasil dibuat! Mengarahkan ke login...');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } catch (err) {
      console.error('Signup error:', err);
      setError('Gagal menyimpan data ke Firebase. Cek koneksi Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      {/* Animated Blobs */}
      <div className="blob blob-left"></div>
      <div className="blob blob-right"></div>

      <div className="signup-card">
        {/* Header */}
        <div className="signup-header">
          <div className="icon-box">
            <Brain className="icon-brain" />
          </div>
          <h1>Daftar AI Planner</h1>
          <div className="subtitle">
            <Sparkles className="sparkle" />
            <span>Mulai kelola jadwal dengan AI</span>
            <Sparkles className="sparkle" />
          </div>
        </div>

        {/* Form Section */}
        <div className="signup-form">
          <h2>Buat Akun Baru 🚀</h2>
          <p>Isi data Anda untuk memulai</p>

          {error && (
            <div className="alert error">
              <div className="dot"></div>
              {error}
            </div>
          )}

          {success && (
            <div className="alert success">
              <CheckCircle size={18} />
              {success}
            </div>
          )}

          {/* Nama */}
          <div className="input-group">
            <label>Nama Lengkap</label>
            <div className="input-wrapper">
              <User className={`input-icon ${focusedField === 'nama' ? 'active' : ''}`} />
              <input
                type="text"
                placeholder="Masukkan nama lengkap"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                onFocus={() => setFocusedField('nama')}
                onBlur={() => setFocusedField('')}
              />
            </div>
          </div>

          {/* Email */}
          <div className="input-group">
            <label>Email</label>
            <div className="input-wrapper">
              <Mail className={`input-icon ${focusedField === 'email' ? 'active' : ''}`} />
              <input
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField('')}
              />
            </div>
          </div>

          {/* Phone */}
          <div className="input-group">
            <label>Nomor WhatsApp 📱</label>
            <div className="input-wrapper">
              <Phone className={`input-icon ${focusedField === 'phone' ? 'active' : ''}`} />
              <input
                type="tel"
                placeholder="628xxxxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                onFocus={() => setFocusedField('phone')}
                onBlur={() => setFocusedField('')}
              />
            </div>
            <p className="note">Untuk notifikasi reminder via WhatsApp</p>
          </div>

          {/* Password */}
          <div className="input-group">
            <label>Password</label>
            <div className="input-wrapper">
              <Lock className={`input-icon ${focusedField === 'password' ? 'active' : ''}`} />
              <input
                type="password"
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField('')}
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div className="input-group">
            <label>Konfirmasi Password</label>
            <div className="input-wrapper">
              <Lock className={`input-icon ${focusedField === 'confirm' ? 'active' : ''}`} />
              <input
                type="password"
                placeholder="Ulangi password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onFocus={() => setFocusedField('confirm')}
                onBlur={() => setFocusedField('')}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button className="signup-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <div className="loader"></div>
                Membuat Akun...
              </>
            ) : (
              <>
                <span>Daftar Sekarang</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>

          {/* Login link */}
          <div className="login-link">
            Sudah punya akun? <a href="/login">Masuk di sini →</a>
          </div>
        </div>

        {/* Footer */}
        <div className="signup-footer">
          <p>© 2025 AI Planner. Semua hak dilindungi.</p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
