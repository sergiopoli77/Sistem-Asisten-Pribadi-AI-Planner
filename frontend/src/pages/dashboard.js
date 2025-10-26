import React, { useState } from 'react';
import '../assets/Dashboard.css';
import Jadwal from './Jadwal';
import ChatAI from './ChatAI';
import RiwayatChat from './RiwayatChat';
import Profile from './Profile';

const Dashboard = ({ user, onLogout }) => {
  const [activeMenu, setActiveMenu] = useState('dashboard');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🧭' },
    { id: 'jadwal', label: 'Jadwal', icon: '🗓️' },
    { id: 'chat', label: 'Chat AI', icon: '🤖' },
    { id: 'riwayat', label: 'Riwayat Chat', icon: '💬' },
    { id: 'profil', label: 'Profil', icon: '👤' },
  ];

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return (
          <div className="dashboard-content">
            <div className="welcome-card">
              <div className="welcome-text">
                <h2>Selamat Datang, {user.username} 👋</h2>
                <p>Kelola kegiatan harianmu dan manfaatkan AI untuk membantu perencanaan yang lebih cerdas.</p>
              </div>
            </div>

            <div className="stats-section">
              <h3>Ringkasan Aktivitas</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <h4>Total Jadwal</h4>
                  <p className="stat-number">12</p>
                  <p className="stat-desc">Kegiatan aktif minggu ini</p>
                </div>
                <div className="stat-card">
                  <h4>Chat dengan AI</h4>
                  <p className="stat-number">38</p>
                  <p className="stat-desc">Percakapan bulan ini</p>
                </div>
                <div className="stat-card">
                  <h4>Rekomendasi AI</h4>
                  <p className="stat-number">5</p>
                  <p className="stat-desc">Saran baru untuk produktivitas</p>
                </div>
              </div>
            </div>

            <div className="activity-section">
              <div className="section-header">
                <h3>Aktivitas Terbaru</h3>
                <button className="btn-view-all">Lihat Semua</button>
              </div>

              <div className="activity-list">
                <div className="activity-item">
                  <div className="activity-icon">🗓️</div>
                  <div>
                    <h4>Meeting dengan Tim</h4>
                    <p>Ditambahkan ke jadwal hari ini</p>
                    <span>5 menit yang lalu</span>
                  </div>
                </div>

                <div className="activity-item">
                  <div className="activity-icon">🤖</div>
                  <div>
                    <h4>Chat AI: “Rencana kerja minggu depan”</h4>
                    <p>AI menyarankan 3 prioritas baru</p>
                    <span>15 menit yang lalu</span>
                  </div>
                </div>

                <div className="activity-item">
                  <div className="activity-icon">✅</div>
                  <div>
                    <h4>Tugas diselesaikan</h4>
                    <p>“Review laporan proyek” ditandai selesai</p>
                    <span>1 jam yang lalu</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'jadwal':
        return <Jadwal />;
      case 'chat':
        return <ChatAI />;
      case 'riwayat':
        return <RiwayatChat />;
      case 'profil':
        return <Profile />;
      default:
        return <div>Pilih menu di sidebar.</div>;
    }
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2 className="brand">AI Planner</h2>
        </div>
        <nav className="menu">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`menu-item ${activeMenu === item.id ? 'active' : ''}`}
              onClick={() => setActiveMenu(item.id)}
            >
              <span className="icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={onLogout}>🚪 Logout</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
};

export default Dashboard;
