import React, { useState, useEffect } from "react";
import { getDatabase, ref, onValue, push, set, remove, update } from "firebase/database";
import "../assets/Jadwal.css";

const Jadwal = () => {
  const [schedules, setSchedules] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [formData, setFormData] = useState({
    kegiatan: "",
    tanggal: "",
    waktuMulai: "",
    waktuSelesai: "",
    lokasi: "",
    prioritas: "Sedang",
    catatan: "",
    status: "Belum Dilaksanakan",
  });

  // Ambil username dari localStorage
  useEffect(() => {
    try {
      const u = localStorage.getItem("username");
      if (u) {
        setCurrentUser(u);
      } else {
        alert("Kamu belum login! Silakan masuk terlebih dahulu.");
        window.location.href = "/login";
      }
    } catch (e) {
      console.warn("Gagal membaca localStorage:", e);
      window.location.href = "/login";
    }
  }, []);

  const db = getDatabase();

  // Ambil data dari Firebase
  useEffect(() => {
    if (!currentUser) return;

    const scheduleRef = ref(db, `schedules/${currentUser}`);
    const unsubscribe = onValue(scheduleRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedSchedules = Object.entries(data).map(([id, value]) => ({
          id,
          ...value,
        }));
        // Urutkan berdasarkan tanggal & waktu
        loadedSchedules.sort((a, b) => {
          const dateA = new Date(`${a.tanggal} ${a.waktuMulai || "00:00"}`);
          const dateB = new Date(`${b.tanggal} ${b.waktuMulai || "00:00"}`);
          return dateB - dateA;
        });
        setSchedules(loadedSchedules);
      } else {
        setSchedules([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, currentUser]);

  // Reset form
  const resetForm = () => {
    setFormData({
      kegiatan: "",
      tanggal: new Date().toISOString().split("T")[0],
      waktuMulai: "08:00",
      waktuSelesai: "09:00",
      lokasi: "",
      prioritas: "Sedang",
      catatan: "",
      status: "Belum Dilaksanakan",
    });
    setEditingSchedule(null);
  };

  // Buka modal untuk tambah
  const handleOpenAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  // Buka modal untuk edit
  const handleOpenEditModal = (schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      kegiatan: schedule.kegiatan || "",
      tanggal: schedule.tanggal || "",
      waktuMulai: schedule.waktuMulai || "08:00",
      waktuSelesai: schedule.waktuSelesai || "09:00",
      lokasi: schedule.lokasi || "",
      prioritas: schedule.prioritas || "Sedang",
      catatan: schedule.catatan || "",
      status: schedule.status || "Belum Dilaksanakan",
    });
    setShowModal(true);
  };

  // Simpan jadwal (tambah/edit)
  const handleSaveSchedule = (e) => {
    e.preventDefault();

    if (!formData.kegiatan.trim()) {
      alert("Nama kegiatan harus diisi!");
      return;
    }

    const scheduleData = {
      ...formData,
      updatedAt: new Date().toISOString(),
    };

    if (editingSchedule) {
      // Update existing
      update(ref(db, `schedules/${currentUser}/${editingSchedule.id}`), scheduleData);
    } else {
      // Create new
      const newScheduleRef = push(ref(db, `schedules/${currentUser}`));
      set(newScheduleRef, {
        ...scheduleData,
        createdAt: new Date().toISOString(),
      });
    }

    setShowModal(false);
    resetForm();
  };

  // Hapus jadwal
  const handleDeleteSchedule = (scheduleId) => {
    if (window.confirm("Yakin ingin menghapus jadwal ini?")) {
      remove(ref(db, `schedules/${currentUser}/${scheduleId}`));
    }
  };

  // Toggle status
  const handleToggleStatus = (schedule) => {
    const statusFlow = {
      "Belum Dilaksanakan": "Sedang Berlangsung",
      "Sedang Berlangsung": "Selesai",
      "Selesai": "Belum Dilaksanakan",
    };

    const newStatus = statusFlow[schedule.status] || "Belum Dilaksanakan";

    update(ref(db, `schedules/${currentUser}/${schedule.id}`), {
      status: newStatus,
    });
  };

  // Filter schedules
  const filteredSchedules = schedules.filter((s) => {
    const matchSearch =
      s.kegiatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.lokasi && s.lokasi.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchStatus = filterStatus === "" || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Get status badge class
  const getStatusClass = (status) => {
    switch (status) {
      case "Belum Dilaksanakan":
        return "status-pending";
      case "Sedang Berlangsung":
        return "status-ongoing";
      case "Selesai":
        return "status-done";
      default:
        return "status-pending";
    }
  };

  // Get priority badge class
  const getPriorityClass = (priority) => {
    switch (priority) {
      case "Tinggi":
        return "priority-high";
      case "Sedang":
        return "priority-medium";
      case "Rendah":
        return "priority-low";
      default:
        return "priority-medium";
    }
  };

  // Statistics
  const stats = {
    total: schedules.length,
    pending: schedules.filter((s) => s.status === "Belum Dilaksanakan").length,
    ongoing: schedules.filter((s) => s.status === "Sedang Berlangsung").length,
    done: schedules.filter((s) => s.status === "Selesai").length,
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Memuat data jadwal...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      {/* Header Section */}
      <div className="page-header">
        <div className="header-content">
          <h1>📅 Kelola Jadwal</h1>
          <p className="header-subtitle">Pantau dan atur seluruh kegiatan Anda dengan mudah</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={handleOpenAddModal}>
            <span className="btn-icon">➕</span>
            Tambah Jadwal Baru
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-mini-grid">
        <div className="stat-mini-card">
          <div className="stat-mini-icon">📊</div>
          <div className="stat-mini-info">
            <p className="stat-mini-label">Total Jadwal</p>
            <p className="stat-mini-value">{stats.total}</p>
          </div>
        </div>
        <div className="stat-mini-card">
          <div className="stat-mini-icon">⏳</div>
          <div className="stat-mini-info">
            <p className="stat-mini-label">Belum Dimulai</p>
            <p className="stat-mini-value">{stats.pending}</p>
          </div>
        </div>
        <div className="stat-mini-card">
          <div className="stat-mini-icon">⚡</div>
          <div className="stat-mini-info">
            <p className="stat-mini-label">Sedang Berjalan</p>
            <p className="stat-mini-value">{stats.ongoing}</p>
          </div>
        </div>
        <div className="stat-mini-card">
          <div className="stat-mini-icon">✅</div>
          <div className="stat-mini-info">
            <p className="stat-mini-label">Selesai</p>
            <p className="stat-mini-value">{stats.done}</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Section */}
      <div className="schedules-section">
        <div className="search-filter-bar">
          <div className="search-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Cari kegiatan atau lokasi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">🔍 Semua Status</option>
            <option value="Belum Dilaksanakan">⏳ Belum Dilaksanakan</option>
            <option value="Sedang Berlangsung">⚡ Sedang Berlangsung</option>
            <option value="Selesai">✅ Selesai</option>
          </select>
        </div>

        {/* Schedule Cards */}
        <div className="schedules-grid">
          {filteredSchedules.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>Belum ada jadwal</h3>
              <p>Mulai tambahkan jadwal pertama Anda untuk mengatur kegiatan dengan lebih baik.</p>
              <button className="btn-primary" onClick={handleOpenAddModal}>
                ➕ Tambah Jadwal
              </button>
            </div>
          ) : (
            filteredSchedules.map((schedule) => (
              <div key={schedule.id} className="schedule-card">
                <div className="schedule-card-header">
                  <div className="schedule-priority">
                    <span className={`priority-badge ${getPriorityClass(schedule.prioritas)}`}>
                      {schedule.prioritas === "Tinggi" && "🔴"}
                      {schedule.prioritas === "Sedang" && "🟡"}
                      {schedule.prioritas === "Rendah" && "🟢"}
                      {schedule.prioritas}
                    </span>
                  </div>
                  <div className="schedule-actions-mini">
                    <button
                      className="btn-icon-mini"
                      title="Edit"
                      onClick={() => handleOpenEditModal(schedule)}
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-icon-mini delete"
                      title="Hapus"
                      onClick={() => handleDeleteSchedule(schedule.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <h3 className="schedule-title">{schedule.kegiatan}</h3>

                <div className="schedule-details">
                  <div className="detail-item">
                    <span className="detail-icon">📅</span>
                    <span>{schedule.tanggal}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-icon">🕐</span>
                    <span>
                      {schedule.waktuMulai || "08:00"} - {schedule.waktuSelesai || "09:00"}
                    </span>
                  </div>
                  {schedule.lokasi && (
                    <div className="detail-item">
                      <span className="detail-icon">📍</span>
                      <span>{schedule.lokasi}</span>
                    </div>
                  )}
                </div>

                {schedule.catatan && (
                  <div className="schedule-notes">
                    <p>💬 {schedule.catatan}</p>
                  </div>
                )}

                <div className="schedule-card-footer">
                  <button
                    className={`status-button ${getStatusClass(schedule.status)}`}
                    onClick={() => handleToggleStatus(schedule)}
                    title="Klik untuk ubah status"
                  >
                    {schedule.status === "Belum Dilaksanakan" && "⏳"}
                    {schedule.status === "Sedang Berlangsung" && "⚡"}
                    {schedule.status === "Selesai" && "✅"}
                    {schedule.status}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Add/Edit */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingSchedule ? "✏️ Edit Jadwal" : "➕ Tambah Jadwal Baru"}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSchedule}>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Nama Kegiatan *</label>
                  <input
                    type="text"
                    placeholder="Contoh: Meeting Tim Proyek"
                    value={formData.kegiatan}
                    onChange={(e) => setFormData({ ...formData, kegiatan: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Tanggal *</label>
                  <input
                    type="date"
                    value={formData.tanggal}
                    onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Prioritas</label>
                  <select
                    value={formData.prioritas}
                    onChange={(e) => setFormData({ ...formData, prioritas: e.target.value })}
                  >
                    <option value="Rendah">🟢 Rendah</option>
                    <option value="Sedang">🟡 Sedang</option>
                    <option value="Tinggi">🔴 Tinggi</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Waktu Mulai *</label>
                  <input
                    type="time"
                    value={formData.waktuMulai}
                    onChange={(e) => setFormData({ ...formData, waktuMulai: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Waktu Selesai *</label>
                  <input
                    type="time"
                    value={formData.waktuSelesai}
                    onChange={(e) => setFormData({ ...formData, waktuSelesai: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label>Lokasi</label>
                  <input
                    type="text"
                    placeholder="Contoh: Ruang Meeting A"
                    value={formData.lokasi}
                    onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Catatan</label>
                  <textarea
                    placeholder="Tambahkan catatan tambahan..."
                    value={formData.catatan}
                    onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                    rows="3"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Belum Dilaksanakan">⏳ Belum Dilaksanakan</option>
                    <option value="Sedang Berlangsung">⚡ Sedang Berlangsung</option>
                    <option value="Selesai">✅ Selesai</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn-save">
                  {editingSchedule ? "💾 Simpan Perubahan" : "➕ Tambah Jadwal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jadwal;