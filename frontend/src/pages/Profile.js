import React, { useEffect, useState } from "react";
import { getDatabase, ref, onValue, update, remove } from "firebase/database";
import "../assets/Profile.css";
import ConfirmModal from "../components/ConfirmModal";

const Profile = () => {
  const [profile, setProfile] = useState({
    nama: "",
    email: "",
    nomor: "",
    jenisKelamin: "",
    password: "",
    bio: "",
    tanggalLahir: "",
    pekerjaan: "",
    lokasi: "",
  });
  const [originalProfile, setOriginalProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("personal");
  const [showPassword, setShowPassword] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [stats, setStats] = useState({
    totalSchedules: 0,
    totalChats: 0,
    memberSince: "",
  });
  const [deleting, setDeleting] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showConfirmDeleteFinal, setShowConfirmDeleteFinal] = useState(false);
  const [infoModal, setInfoModal] = useState(null);

  const db = getDatabase();

  


  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const username = localStorage.getItem("username");
    if (!username) {
      setInfoModal({
        title: "Belum Login",
        message: "Kamu belum login!",
        confirmLabel: "Masuk",
        cancelLabel: "Tutup",
        onConfirm: () => {
          setInfoModal(null);
          window.location.href = "/login";
        },
      });
      return;
    }
    setCurrentUser(username);

    // Load user profile
    const userRef = ref(db, `users/${username}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setProfile(data);
        setOriginalProfile(data);
        
        // Set member since (handle both numeric timestamps and ISO strings)
        if (data.createdAt) {
          const ts = Number(data.createdAt);
          const date = !isNaN(ts) ? new Date(ts) : new Date(data.createdAt);
          setStats((prev) => ({
            ...prev,
            memberSince: date.toLocaleDateString("id-ID", {
              year: "numeric",
              month: "long",
            }),
          }));
        }
      }
      setLoading(false);
    });

    // Load statistics (schedules & chats counts)
    const schedulesRef = ref(db, `schedules/${username}`);
    onValue(schedulesRef, (snapshot) => {
      const data = snapshot.val();
      const count = data ? Object.keys(data).length : 0;
      setStats((prev) => ({ ...prev, totalSchedules: count }));
    });

    const chatsRef = ref(db, `chats/${username}`);
    onValue(chatsRef, (snapshot) => {
      const data = snapshot.val();
      const count = data ? Object.keys(data).length : 0;
      setStats((prev) => ({ ...prev, totalChats: count }));
    });

    return () => unsubscribe();
  }, [db]);

  // Check for changes
  useEffect(() => {
    const changed = JSON.stringify(profile) !== JSON.stringify(originalProfile);
    setHasChanges(changed);
  }, [profile, originalProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!currentUser) return;

    // Validation
    if (!profile.nama?.trim()) {
      setInfoModal({ title: "Perhatian", message: "⚠️ Nama lengkap harus diisi!" });
      return;
    }

    if (!profile.email?.trim()) {
      setInfoModal({ title: "Perhatian", message: "⚠️ Email harus diisi!" });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profile.email)) {
      setInfoModal({ title: "Perhatian", message: "⚠️ Format email tidak valid!" });
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        ...profile,
        updatedAt: new Date().toISOString(),
      };

      await update(ref(db, `users/${currentUser}`), updateData);
      setOriginalProfile(updateData);
      setInfoModal({ title: "Sukses", message: "✅ Profil berhasil diperbarui!" });
    } catch (error) {
      console.error(error);
      setInfoModal({ title: "Gagal", message: "❌ Gagal menyimpan profil!" });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setProfile(originalProfile);
    setHasChanges(false);
  };

  const handleLogout = () => {
    setLogoutLoading(true);
    // small delay for spinner animation
    setTimeout(() => {
      localStorage.removeItem("username");
      window.location.href = "/login";
    }, 600);
  };

  const handleDeleteAccount = async () => {
    // Show first confirmation modal (we handle double confirmation with two modals)
    setShowConfirmDelete(true);
  };

  const handleConfirmDeleteFirst = () => {
    setShowConfirmDelete(false);
    setShowConfirmDeleteFinal(true);
  };

  const handleConfirmDeleteFinal = async () => {
    setShowConfirmDeleteFinal(false);
    if (!currentUser) {
      setInfoModal({
        title: "Error",
        message: "Tidak dapat menemukan user saat ini. Silakan login terlebih dahulu.",
        onConfirm: () => {
          setInfoModal(null);
          window.location.href = "/login";
        },
      });
      return;
    }

    try {
      setDeleting(true);

      const paths = [
        `users/${currentUser}`,
        `schedules/${currentUser}`,
        `chats/${currentUser}`,
        `chatHistory/${currentUser}`,
      ];

      const ops = paths.map((p) => remove(ref(db, p)));

      const results = await Promise.allSettled(ops);

      const rejected = results.filter((r) => r.status === "rejected");

      if (rejected.length > 0) {
        console.error("Beberapa penghapusan gagal:", rejected);
        setInfoModal({ title: "Gagal", message: "Terjadi kesalahan saat menghapus beberapa data. Silakan coba lagi atau hubungi admin." });
        setDeleting(false);
        return;
      }

      // Success - clear session and redirect
      localStorage.removeItem("username");
      setInfoModal({
        title: "Sukses",
        message: "Akun dan semua data berhasil dihapus.",
        onConfirm: () => {
          setInfoModal(null);
          window.location.href = "/login";
        },
      });
    } catch (err) {
      console.error("Gagal menghapus akun:", err);
      setInfoModal({ title: "Gagal", message: "Gagal menghapus akun. Silakan coba lagi nanti." });
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Memuat data profil...</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Confirm modals for delete account */}
      <ConfirmModal
        open={showConfirmDelete}
        title="Hapus Akun"
        message={`⚠️ PERINGATAN!\n\nMenghapus akun akan menghapus semua data Anda secara permanen termasuk:\n• Semua jadwal\n• Riwayat chat AI\n• Informasi profil\n\nTindakan ini TIDAK DAPAT dibatalkan!\n\nApakah Anda yakin ingin melanjutkan?`}
        confirmLabel="Lanjut"
        cancelLabel="Batal"
        onConfirm={handleConfirmDeleteFirst}
        onCancel={() => setShowConfirmDelete(false)}
      />
      <ConfirmModal
        open={showConfirmDeleteFinal}
        title="Konfirmasi Terakhir"
        message={`Konfirmasi sekali lagi: Apakah Anda benar-benar ingin menghapus akun?`}
        confirmLabel="Hapus Akun"
        cancelLabel="Batal"
        onConfirm={handleConfirmDeleteFinal}
        onCancel={() => setShowConfirmDeleteFinal(false)}
      />
      {/* Generic info/result modal (used instead of alert()) */}
      {infoModal && (
        <ConfirmModal
          open={true}
          title={infoModal.title}
          message={infoModal.message}
          confirmLabel={infoModal.confirmLabel || "OK"}
          cancelLabel={infoModal.cancelLabel || "Tutup"}
          onConfirm={() => {
            try {
              if (infoModal.onConfirm) infoModal.onConfirm();
            } finally {
              setInfoModal(null);
            }
          }}
          onCancel={() => {
            try {
              if (infoModal.onCancel) infoModal.onCancel();
            } finally {
              setInfoModal(null);
            }
          }}
        />
      )}
      {(deleting || logoutLoading) && (
        <div className="spinner-overlay">
          <div className="spinner-box">
            <div className="loading-spinner"></div>
            <p>{deleting ? "Menghapus akun..." : "Keluar..."}</p>
          </div>
        </div>
      )}
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-header-content">
          <div className="profile-avatar-section">
              <div className="profile-avatar-wrapper">
              <div className="profile-avatar">
                {profile.nama?.charAt(0)?.toUpperCase() || "?"}
              </div>
              <button className="avatar-edit-btn" title="Ubah foto profil">
                📷
              </button>
              <button
                className="avatar-logout-btn"
                title="Keluar"
                onClick={handleLogout}
              >
                🚪
              </button>
            </div>
            <div className="profile-info">
              <h1>{profile.nama || "Nama Belum Diatur"}</h1>
              <p className="profile-username">@{currentUser}</p>
              <div className="profile-badges">
                <span className="badge badge-premium">Premium User</span>
                <span className="badge badge-verified">✓ Verified</span>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="profile-stats">
            <div className="stat-box">
              <div className="stat-icon">📅</div>
              <div className="stat-info">
                <p className="stat-value">{stats.totalSchedules}</p>
                <p className="stat-label">Jadwal</p>
              </div>
            </div>
            <div className="stat-box">
              <div className="stat-icon">💬</div>
              <div className="stat-info">
                <p className="stat-value">{stats.totalChats}</p>
                <p className="stat-label">Chat AI</p>
              </div>
            </div>
            <div className="stat-box">
              <div className="stat-icon">📆</div>
              <div className="stat-info">
                <p className="stat-value">{stats.memberSince || "2024"}</p>
                <p className="stat-label">Member Sejak</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="profile-tabs">
        <button
          className={`tab-btn ${activeTab === "personal" ? "active" : ""}`}
          onClick={() => setActiveTab("personal")}
        >
          <span className="tab-icon">👤</span>
          Informasi Pribadi
        </button>
        <button
          className={`tab-btn ${activeTab === "account" ? "active" : ""}`}
          onClick={() => setActiveTab("account")}
        >
          <span className="tab-icon">🔐</span>
          Keamanan Akun
        </button>
        <button
          className={`tab-btn ${activeTab === "settings" ? "active" : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          <span className="tab-icon">⚙️</span>
          Pengaturan
        </button>
      </div>

      {/* Tab Content */}
      <div className="profile-content">
        {activeTab === "personal" && (
          <div className="profile-section">
            <div className="section-header">
              <h2>📝 Informasi Pribadi</h2>
              <p>Kelola data pribadi dan informasi kontak Anda</p>
            </div>

            <div className="form-grid">
              <div className="form-group full-width">
                <label>Nama Lengkap *</label>
                <input
                  type="text"
                  name="nama"
                  value={profile.nama || ""}
                  onChange={handleChange}
                  placeholder="Masukkan nama lengkap"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={profile.email || ""}
                  onChange={handleChange}
                  placeholder="nama@email.com"
                  required
                />
              </div>

              <div className="form-group">
                <label>Nomor WhatsApp</label>
                <input
                  type="tel"
                  name="nomor"
                  value={profile.nomor || ""}
                  onChange={handleChange}
                  placeholder="+62 812-3456-7890"
                />
              </div>

              <div className="form-group">
                <label>Jenis Kelamin</label>
                <select
                  name="jenisKelamin"
                  value={profile.jenisKelamin || ""}
                  onChange={handleChange}
                >
                  <option value="">Pilih jenis kelamin</option>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>

              <div className="form-group">
                <label>Tanggal Lahir</label>
                <input
                  type="date"
                  name="tanggalLahir"
                  value={profile.tanggalLahir || ""}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Pekerjaan</label>
                <input
                  type="text"
                  name="pekerjaan"
                  value={profile.pekerjaan || ""}
                  onChange={handleChange}
                  placeholder="Contoh: Software Engineer"
                />
              </div>

              <div className="form-group">
                <label>Lokasi</label>
                <input
                  type="text"
                  name="lokasi"
                  value={profile.lokasi || ""}
                  onChange={handleChange}
                  placeholder="Contoh: Jakarta, Indonesia"
                />
              </div>

              <div className="form-group full-width">
                <label>Bio</label>
                <textarea
                  name="bio"
                  value={profile.bio || ""}
                  onChange={handleChange}
                  placeholder="Ceritakan sedikit tentang diri Anda..."
                  rows="4"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "account" && (
          <div className="profile-section">
            <div className="section-header">
              <h2>🔐 Keamanan Akun</h2>
              <p>Kelola password dan keamanan akun Anda</p>
            </div>

            <div className="form-grid">
              <div className="form-group full-width">
                <label>Username</label>
                <input
                  type="text"
                  value={currentUser}
                  disabled
                  className="disabled-input"
                />
                <small className="form-hint">Username tidak dapat diubah</small>
              </div>

              <div className="form-group full-width">
                <label>Password Baru</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={profile.password || ""}
                    onChange={handleChange}
                    onBlur={async () => {
                      // Update password immediately on blur if changed
                      try {
                        if (!currentUser) return;
                        const newPass = profile.password || "";
                        const oldPass = originalProfile.password || "";
                        if (newPass && newPass !== oldPass) {
                          if (newPass.length < 6) {
                            setInfoModal({ title: "Perhatian", message: "⚠️ Password minimal 6 karakter." });
                            return;
                          }
                          setSaving(true);
                          await update(ref(db, `users/${currentUser}`), {
                            password: newPass,
                            updatedAt: new Date().toISOString(),
                          });
                          setOriginalProfile((prev) => ({ ...prev, password: newPass }));
                          setInfoModal({ title: "Sukses", message: "✅ Password berhasil diperbarui!" });
                        }
                      } catch (err) {
                        console.error("Gagal update password:", err);
                        setInfoModal({ title: "Gagal", message: "❌ Gagal memperbarui password. Coba lagi." });
                      } finally {
                        setSaving(false);
                      }
                    }}
                    placeholder="Masukkan password baru"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
                <small className="form-hint">
                  Minimal 6 karakter. Kombinasikan huruf, angka, dan simbol untuk keamanan lebih baik.
                </small>
              </div>

              <div className="security-info">
                <div className="info-card">
                  <div className="info-icon">🛡️</div>
                  <div className="info-content">
                    <h4>Status Keamanan</h4>
                    <p>Akun Anda aman dan terlindungi</p>
                  </div>
                </div>
                <div className="info-card">
                  <div className="info-icon">📱</div>
                  <div className="info-content">
                    <h4>Notifikasi WhatsApp</h4>
                    <p>Aktif untuk reminder jadwal</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        

        {activeTab === "settings" && (
          <div className="profile-section">
            <div className="section-header">
              <h2>⚙️ Pengaturan Akun</h2>
              <p>Kelola preferensi dan pengaturan aplikasi</p>
            </div>

            <div className="settings-list">
              {/* Notifikasi Email removed as requested */}

              <div className="setting-item">
                <div className="setting-info">
                  <h4>📱 Notifikasi WhatsApp</h4>
                  <p>Reminder otomatis via WhatsApp</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              {/* Mode Gelap removed per user request */}

              <div className="setting-item">
                <div className="setting-info">
                  <h4>🤖 Auto Save Chat AI</h4>
                  <p>Simpan percakapan AI secara otomatis</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div className="danger-zone">
              <h3>⚠️ Zona Berbahaya</h3>
              <p>Tindakan berikut bersifat permanen dan tidak dapat dibatalkan</p>
              <button className="btn-danger" onClick={handleDeleteAccount}>
                🗑️ Hapus Akun Permanen
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {hasChanges && (
        <div className="profile-actions">
          <div className="actions-wrapper">
            <button className="btn-cancel" onClick={handleCancel}>
              ✕ Batal
            </button>
            <button
              className="btn-save"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "💾 Menyimpan..." : "💾 Simpan Perubahan"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;

//test