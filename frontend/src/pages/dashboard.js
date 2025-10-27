import React, { useState, useEffect } from 'react';
import '../assets/Dashboard.css';
import { getDatabase, ref, onValue } from 'firebase/database';
import Jadwal from './Jadwal';
import ChatAI from './ChatAI';
import RiwayatChat from './RiwayatChat';
import Profile from './Profile';

const Dashboard = ({ user, onLogout }) => {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [continueChat, setContinueChat] = useState(null);
  const [totalSchedules, setTotalSchedules] = useState(0);
  const [totalChats, setTotalChats] = useState(0);
  const [remindersCount, setRemindersCount] = useState(0);
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  const db = getDatabase();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // listen for continueChat events from RiwayatChat
    const handler = (e) => {
      const chat = e.detail;
      if (chat) {
        setContinueChat(chat);
        setActiveMenu('chat');
      }
    };
    window.addEventListener('continueChat', handler);

    // also check localStorage fallback (in case another tab set it)
    try {
      const stored = localStorage.getItem('continueChat');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed) {
          setContinueChat(parsed);
          setActiveMenu('chat');
          localStorage.removeItem('continueChat');
        }
      }
    } catch (e) {
      // ignore
    }

    try {
      const u = localStorage.getItem('username');
      if (!u) {
        // not logged in, redirect to login
        if (typeof window !== 'undefined') window.location.href = '/login';
        return;
      }
      setCurrentUser(u);

      const schedulesRef = ref(db, `schedules/${u}`);
      const chatsRef = ref(db, `chats/${u}`);

      const unsubSchedules = onValue(schedulesRef, (snap) => {
        const data = snap.val();
        const items = data
          ? Object.entries(data).map(([id, v]) => ({ id, ...v }))
          : [];

        setTotalSchedules(items.length);

        // reminders = schedules not finished
        const reminders = items.filter((s) => !s.status || s.status !== 'Selesai').length;
        setRemindersCount(reminders);

        // today's schedules
        const today = new Date().toISOString().split('T')[0];
        const todayItems = items.filter((s) => (s.tanggal || s.date || '').startsWith ? (s.tanggal || s.date || '').startsWith(today) : (s.tanggal || s.date) === today);
        setTodaySchedules(todayItems);

        // recent activities from schedules
        const scheduleActivities = items
          .map((s) => ({
            type: 'schedule',
            title: s.kegiatan || s.title || 'Jadwal baru',
            date: s.createdAt || s.date || '',
            id: s.id,
          }))
          .sort((a, b) => new Date(b.date) - new Date(a.date));

        setRecentActivities((prev) => {
          // combine with existing chats later in chat subscription
          const combined = [...scheduleActivities, ...prev.filter((p) => p.type === 'chat')];
          const sorted = combined.sort((a, b) => new Date(b.date) - new Date(a.date));
          return sorted.slice(0, 6);
        });
      });

      const unsubChats = onValue(chatsRef, (snap) => {
        const data = snap.val();
        const items = data
          ? Object.entries(data).map(([id, v]) => ({ id, ...v }))
          : [];

        setTotalChats(items.length);

        // map chats to recentActivities entries
        const chatActivities = items
          .map((c) => ({
            type: 'chat',
            title: c.lastMessage || (c.messages && c.messages[c.messages.length - 1]?.text) || 'Percakapan AI',
            date: c.date || c.createdAt || '',
            id: c.id,
          }))
          .sort((a, b) => new Date(b.date) - new Date(a.date));

        setRecentActivities((prev) => {
          const schedulePrev = prev.filter((p) => p.type === 'schedule');
          const combined = [...schedulePrev, ...chatActivities];
          const sorted = combined.sort((a, b) => new Date(b.date) - new Date(a.date));
          return sorted.slice(0, 6);
        });
      });

      return () => {
        unsubSchedules();
        unsubChats();
        window.removeEventListener('continueChat', handler);
      };
    } catch (e) {
      console.warn('Dashboard data load error:', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

            {/* Stats Cards (data from Firebase) */}
            <div className="stats-section">
              <div className="stats-grid">
                <div className="stat-card stat-primary">
                  <div className="stat-icon">📊</div>
                  <div className="stat-info">
                    <h3>Total Kegiatan</h3>
                    <p className="stat-number">{totalSchedules}</p>
                    <span className="stat-change positive">{totalSchedules > 0 ? `+${Math.max(0, Math.floor(totalSchedules * 0.1))} dari minggu lalu` : "-"}</span>
                  </div>
                </div>

                <div className="stat-card stat-success">
                  <div className="stat-icon">✅</div>
                  <div className="stat-info">
                    <h3>Selesai Hari Ini</h3>
                    <p className="stat-number">{`${todaySchedules.filter(s => s.status === 'Selesai').length}/${todaySchedules.length || 0}`}</p>
                    <span className="stat-change">{todaySchedules.length ? `${Math.round((todaySchedules.filter(s => s.status === 'Selesai').length / todaySchedules.length) * 100)}% completion rate` : 'Belum ada'}</span>
                  </div>
                </div>

                <div className="stat-card stat-warning">
                  <div className="stat-icon">⏰</div>
                  <div className="stat-info">
                    <h3>Reminder Aktif</h3>
                    <p className="stat-number">{remindersCount}</p>
                    <span className="stat-change">Notifikasi WhatsApp</span>
                  </div>
                </div>

                <div className="stat-card stat-info">
                  <div className="stat-icon">🧠</div>
                  <div className="stat-info">
                    <h3>Chat AI</h3>
                    <p className="stat-number">{totalChats}</p>
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
                  <p>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <button className="btn-link" onClick={() => setActiveMenu('jadwal')}>
                  Lihat Semua →
                </button>
              </div>
              <div className="schedule-timeline">
                {todaySchedules.length === 0 ? (
                  <p>Tidak ada kegiatan hari ini.</p>
                ) : (
                  todaySchedules.map((s) => {
                    const start = s.waktu || s.waktuMulai || s.time || '';
                    const duration = s.duration || s.durasi || '';
                    const title = s.kegiatan || s.title || 'Tanpa judul';
                    const category = s.kategori || s.kategori || '';
                    const status = s.status || 'Belum Dilaksanakan';
                    return (
                      <div key={s.id} className="timeline-item">
                        <div className="timeline-time">
                          <span className="time">{start}</span>
                          <span className="duration">{duration}</span>
                        </div>
                        <div className="timeline-content">
                          <div className={`timeline-badge priority-${(s.prioritas || '').toLowerCase()}`}></div>
                          <div className="timeline-details">
                            <h4>{title}</h4>
                            {category && <p>� Kategori: {category}</p>}
                            <span className={`timeline-status ${status === 'Selesai' ? 'done' : status === 'Sedang Berlangsung' ? 'in-progress' : 'upcoming'}`}>{status}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
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
                {recentActivities.length === 0 ? (
                  <p>Tidak ada aktivitas terbaru.</p>
                ) : (
                  recentActivities.map((act) => (
                    <div key={act.id} className="activity-card">
                      <div className={`activity-icon-wrapper ${act.type === 'chat' ? 'bg-purple' : 'bg-blue'}`}>
                        <span className="activity-icon">{act.type === 'chat' ? '🤖' : '📅'}</span>
                      </div>
                      <div className="activity-content">
                        <h4>{act.title}</h4>
                        <p>{act.type === 'chat' ? 'Percakapan dengan AI' : 'Kegiatan baru'}</p>
                        <span className="activity-time">{act.date ? new Date(act.date).toLocaleString() : ''}</span>
                      </div>
                    </div>
                  ))
                )}
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
        return <ChatAI initialChat={continueChat} />;
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