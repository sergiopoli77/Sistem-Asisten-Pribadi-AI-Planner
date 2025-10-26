import React, { useState } from 'react';
import '../assets/Dashboard.css';
import Jadwal from './Jadwal';
import ChatAI from './ChatAI';
import RiwayatChat from './RiwayatChat';
import Profile from './Profile';

const Dashboard = ({ user, onLogout }) => {
  const [activeMenu, setActiveMenu] = useState('dashboard');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'jadwal', label: 'Jadwal', icon: '📅' },
    { id: 'chat', label: 'Chat AI', icon: '🤖' },
    { id: 'riwayat', label: 'Riwayat', icon: '💬' },
    { id: 'profil', label: 'Profil', icon: '👤' },
  ];

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return (
          <div className="dashboard-content">
            {/* Welcome Section */}
            <div className="welcome-section">
              <div className="welcome-card">
                <div className="welcome-text">
                  <h1>Selamat Datang Kembali, {user.username}! 👋</h1>
                  <p>AI Planner siap membantu Anda mengatur jadwal dan meningkatkan produktivitas hari ini.</p>
                </div>
                <div className="welcome-actions">
                  <button className="btn-primary" onClick={() => setActiveMenu('jadwal')}>
                    ➕ Tambah Jadwal Baru
                  </button>
                  <button className="btn-secondary" onClick={() => setActiveMenu('chat')}>
                    🤖 Chat dengan AI
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-section">
              <div className="stats-grid">
                <div className="stat-card stat-primary">
                  <div className="stat-icon">📊</div>
                  <div className="stat-info">
                    <h3>Total Kegiatan</h3>
                    <p className="stat-number">24</p>
                    <span className="stat-change positive">+3 dari minggu lalu</span>
                  </div>
                </div>

                <div className="stat-card stat-success">
                  <div className="stat-icon">✅</div>
                  <div className="stat-info">
                    <h3>Selesai Hari Ini</h3>
                    <p className="stat-number">8/12</p>
                    <span className="stat-change">67% completion rate</span>
                  </div>
                </div>

                <div className="stat-card stat-warning">
                  <div className="stat-icon">⏰</div>
                  <div className="stat-info">
                    <h3>Reminder Aktif</h3>
                    <p className="stat-number">5</p>
                    <span className="stat-change">Notifikasi WhatsApp</span>
                  </div>
                </div>

                <div className="stat-card stat-info">
                  <div className="stat-icon">🧠</div>
                  <div className="stat-info">
                    <h3>Chat AI</h3>
                    <p className="stat-number">42</p>
                    <span className="stat-change">Percakapan bulan ini</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Schedule */}
            <div className="today-schedule-section">
              <div className="section-header">
                <div>
                  <h2>Kegiatan Hari Ini</h2>
                  <p>Sabtu, 26 Oktober 2024</p>
                </div>
                <button className="btn-link" onClick={() => setActiveMenu('jadwal')}>
                  Lihat Semua →
                </button>
              </div>

              <div className="schedule-timeline">
                <div className="timeline-item">
                  <div className="timeline-time">
                    <span className="time">08:00</span>
                    <span className="duration">2 jam</span>
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-badge priority-high"></div>
                    <div className="timeline-details">
                      <h4>Belajar React & Node.js</h4>
                      <p>📚 Kategori: Pembelajaran</p>
                      <span className="timeline-status upcoming">Akan Datang</span>
                    </div>
                  </div>
                </div>

                <div className="timeline-item">
                  <div className="timeline-time">
                    <span className="time">10:30</span>
                    <span className="duration">1 jam</span>
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-badge priority-medium"></div>
                    <div className="timeline-details">
                      <h4>Meeting Tim Proyek</h4>
                      <p>👥 Kategori: Rapat</p>
                      <span className="timeline-status in-progress">Sedang Berlangsung</span>
                    </div>
                  </div>
                </div>

                <div className="timeline-item">
                  <div className="timeline-time">
                    <span className="time">15:00</span>
                    <span className="duration">1.5 jam</span>
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-badge priority-low"></div>
                    <div className="timeline-details">
                      <h4>Olahraga Sore</h4>
                      <p>💪 Kategori: Kesehatan</p>
                      <span className="timeline-status upcoming">Akan Datang</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="activity-section">
              <div className="section-header">
                <h2>Aktivitas Terbaru</h2>
                <button className="btn-link" onClick={() => setActiveMenu('riwayat')}>
                  Lihat Semua →
                </button>
              </div>

              <div className="activity-grid">
                <div className="activity-card">
                  <div className="activity-icon-wrapper bg-blue">
                    <span className="activity-icon">📅</span>
                  </div>
                  <div className="activity-content">
                    <h4>Jadwal Ditambahkan</h4>
                    <p>Meeting dengan Tim</p>
                    <span className="activity-time">5 menit yang lalu</span>
                  </div>
                </div>

                <div className="activity-card">
                  <div className="activity-icon-wrapper bg-purple">
                    <span className="activity-icon">🤖</span>
                  </div>
                  <div className="activity-content">
                    <h4>Rekomendasi AI</h4>
                    <p>AI menyarankan 3 prioritas baru</p>
                    <span className="activity-time">15 menit yang lalu</span>
                  </div>
                </div>

                <div className="activity-card">
                  <div className="activity-icon-wrapper bg-green">
                    <span className="activity-icon">✅</span>
                  </div>
                  <div className="activity-content">
                    <h4>Tugas Selesai</h4>
                    <p>Review laporan proyek</p>
                    <span className="activity-time">1 jam yang lalu</span>
                  </div>
                </div>

                <div className="activity-card">
                  <div className="activity-icon-wrapper bg-orange">
                    <span className="activity-icon">🔔</span>
                  </div>
                  <div className="activity-content">
                    <h4>Reminder Terkirim</h4>
                    <p>Notifikasi WhatsApp untuk kegiatan pukul 15:00</p>
                    <span className="activity-time">2 jam yang lalu</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Quick Access */}
            <div className="ai-quick-section">
              <div className="ai-card">
                <div className="ai-header">
                  <h3>🧠 Tanya AI Planner</h3>
                  <p>Biarkan AI membantu Anda mengatur jadwal dengan cerdas</p>
                </div>
                <div className="ai-suggestions">
                  <button className="suggestion-chip" onClick={() => setActiveMenu('chat')}>
                    "Bantu atur jadwal belajar minggu ini"
                  </button>
                  <button className="suggestion-chip" onClick={() => setActiveMenu('chat')}>
                    "Rekomendasi waktu olahraga"
                  </button>
                  <button className="suggestion-chip" onClick={() => setActiveMenu('chat')}>
                    "Jadwal meeting dan deadline"
                  </button>
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
          <div className="brand">
            <span className="brand-icon">🧭</span>
            <h2>AI Planner</h2>
          </div>
        </div>

        <nav className="menu">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`menu-item ${activeMenu === item.id ? 'active' : ''}`}
              onClick={() => setActiveMenu(item.id)}
            >
              <span className="menu-icon">{item.icon}</span>
              <span className="menu-label">{item.label}</span>
              {activeMenu === item.id && <span className="menu-indicator"></span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">{user.username.charAt(0).toUpperCase()}</div>
            <div className="user-info">
              <p className="user-name">{user.username}</p>
              <p className="user-role">Premium User</p>
            </div>
          </div>
          <button className="logout-btn" onClick={onLogout}>
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="content-wrapper">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;