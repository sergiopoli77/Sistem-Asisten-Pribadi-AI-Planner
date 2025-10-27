import React, { useState } from 'react';
import './App.css';
import Login from './pages/login';
import Dashboard from './pages/dashboard';
import Signup from './pages/signup';
import ForgotPassword from './pages/ForgotPassword';

function App() {
  const [user, setUser] = useState(null);

  const handleLogout = () => {
    setUser(null);
    // bersihkan localStorage saat logout agar halaman yang memeriksa localStorage tidak salah deteksi
    try {
      localStorage.removeItem('username');
      localStorage.removeItem('displayName');
      localStorage.removeItem('role');
    } catch (e) {
      console.warn('Gagal membersihkan localStorage saat logout:', e);
    }
    // redirect ke login untuk memastikan state ter-reset
    if (typeof window !== 'undefined') window.location.href = '/login';
  };

  // jika user belum login, tampilkan login
  if (!user) {
    // Simple pathname-based routing for public pages
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path === '/signup') {
        return <Signup onRegistered={() => { window.location.href = '/'; }} />;
      }
      if (path === '/forgot' || path === '/forgot-password' || path === '/ganti-password') {
        return <ForgotPassword />;
      }
    }

    return <Login onLogin={setUser} />;
  }

  // jika sudah login tampilkan dashboard
  return (
    <div className="App">
      <Dashboard user={user} onLogout={handleLogout} />
    </div>
  );
}

export default App;
