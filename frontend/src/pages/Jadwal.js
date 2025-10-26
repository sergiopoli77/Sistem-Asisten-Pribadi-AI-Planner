import React, { useState, useEffect } from "react";
import { getDatabase, ref, onValue, push, set, remove, update } from "firebase/database";
import "../assets/Jadwal.css";

const Jadwal = () => {
  const [schedules, setSchedules] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [loading, setLoading] = useState(true);

  // Ganti ini sesuai user login
  const currentUser = "sergiopoli"; 

  const db = getDatabase();

  // Ambil data dari Firebase
  useEffect(() => {
    const scheduleRef = ref(db, `schedules/${currentUser}`);
    const unsubscribe = onValue(scheduleRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedSchedules = Object.entries(data).map(([id, value]) => ({
          id,
          ...value,
        }));
        setSchedules(loadedSchedules);
      } else {
        setSchedules([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, currentUser]);

  // Tambah jadwal baru
  const handleAddSchedule = () => {
    const kegiatan = prompt("Masukkan nama kegiatan:");
    if (!kegiatan) return;

    const newScheduleRef = push(ref(db, `schedules/${currentUser}`));
    const newSchedule = {
      kegiatan,
      tanggal: new Date().toISOString().split("T")[0],
      waktu: "08:00",
      lokasi: "Belum ditentukan",
      status: "Belum Dilaksanakan",
      createdAt: new Date().toISOString(),
    };

    set(newScheduleRef, newSchedule);
  };

  // Hapus jadwal
  const handleDeleteSchedule = (scheduleId) => {
    if (window.confirm("Yakin ingin menghapus jadwal ini?")) {
      remove(ref(db, `schedules/${currentUser}/${scheduleId}`));
    }
  };

  // Edit jadwal
  const handleEditSchedule = (schedule) => {
    const kegiatanBaru = prompt("Ubah nama kegiatan:", schedule.kegiatan);
    if (!kegiatanBaru) return;

    update(ref(db, `schedules/${currentUser}/${schedule.id}`), {
      kegiatan: kegiatanBaru,
    });
  };

  const filteredSchedules = schedules.filter((s) => {
    const matchSearch =
      s.kegiatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.lokasi.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === "" || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const getStatusClass = (status) => {
    switch (status) {
      case "Belum Dilaksanakan":
        return "pending";
      case "Sedang Berlangsung":
        return "ongoing";
      case "Selesai":
        return "done";
      default:
        return "";
    }
  };

  if (loading) return <p>Memuat data jadwal...</p>;

  return (
    <div className="dashboard-content">
      <div className="page-header">
        <div className="header-content">
          <h1>Daftar Jadwal</h1>
          <p className="header-subtitle">Kelola dan pantau seluruh jadwal kegiatan</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={handleAddSchedule}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13H13v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
            Tambah Jadwal
          </button>
        </div>
      </div>

      <div className="schedules-section">
        <div className="section-header">
          <h3 className="section-title">Jadwal Kegiatan</h3>
          <div className="search-filter">
            <div className="search-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Cari jadwal..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Semua Status</option>
              <option value="Belum Dilaksanakan">Belum Dilaksanakan</option>
              <option value="Sedang Berlangsung">Sedang Berlangsung</option>
              <option value="Selesai">Selesai</option>
            </select>
          </div>
        </div>

        <div className="schedules-table">
          <div className="table-header">
            <div className="th">Kegiatan</div>
            <div className="th">Tanggal</div>
            <div className="th">Waktu</div>
            <div className="th">Lokasi</div>
            <div className="th">Status</div>
            <div className="th">Aksi</div>
          </div>

          <div className="table-body">
            {filteredSchedules.length === 0 ? (
              <div className="table-row">
                <div className="td" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "2rem" }}>
                  <p>Tidak ada jadwal ditemukan</p>
                </div>
              </div>
            ) : (
              filteredSchedules.map((schedule) => (
                <div key={schedule.id} className="table-row">
                  <div className="td">{schedule.kegiatan}</div>
                  <div className="td">{schedule.tanggal}</div>
                  <div className="td">{schedule.waktu}</div>
                  <div className="td">{schedule.lokasi}</div>
                  <div className="td">
                    <span className={`status-badge ${getStatusClass(schedule.status)}`}>
                      {schedule.status}
                    </span>
                  </div>
                  <div className="td">
                    <div className="action-buttons">
                      <button
                        className="btn-action edit"
                        title="Edit"
                        onClick={() => handleEditSchedule(schedule)}
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-action delete"
                        title="Hapus"
                        onClick={() => handleDeleteSchedule(schedule.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Jadwal;
