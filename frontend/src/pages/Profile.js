import React, { useEffect, useState } from "react";
import { getDatabase, ref, onValue, update } from "firebase/database";
import "../assets/Profile.css";

const Profile = () => {
  const [profile, setProfile] = useState({
    nama: "",
    email: "",
    nomor: "",
    jenisKelamin: "",
    password: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const db = getDatabase();

  useEffect(() => {
    const username = localStorage.getItem("username"); // ambil user yang login
    if (!username) {
      alert("Kamu belum login!");
      window.location.href = "/login"; // redirect ke halaman login
      return;
    }
    setCurrentUser(username);

    const userRef = ref(db, `users/${username}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setProfile(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      await update(ref(db, `users/${currentUser}`), profile);
      alert("✅ Profil berhasil diperbarui!");
    } catch (error) {
      console.error(error);
      alert("❌ Gagal menyimpan profil!");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Memuat data profil...</p>;

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h2>👤 Profil Pengguna</h2>
        <p className="profile-subtitle">Kelola informasi akun kamu</p>

        <div className="profile-field">
          <label>Nama Lengkap</label>
          <input
            type="text"
            name="nama"
            value={profile.nama || ""}
            onChange={handleChange}
            placeholder="Masukkan nama lengkap"
          />
        </div>

        <div className="profile-field">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={profile.email || ""}
            onChange={handleChange}
            placeholder="Masukkan email"
          />
        </div>

        <div className="profile-field">
          <label>Nomor WhatsApp</label>
          <input
            type="text"
            name="nomor"
            value={profile.nomor || ""}
            onChange={handleChange}
            placeholder="Masukkan nomor WA"
          />
        </div>

        <div className="profile-field">
          <label>Jenis Kelamin</label>
          <select
            name="jenisKelamin"
            value={profile.jenisKelamin || ""}
            onChange={handleChange}
          >
            <option value="">Belum diisi</option>
            <option value="Laki-laki">Laki-laki</option>
            <option value="Perempuan">Perempuan</option>
          </select>
        </div>

        <div className="profile-field">
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={profile.password || ""}
            onChange={handleChange}
            placeholder="Masukkan password"
          />
        </div>

        <button className="save-btn" onClick={handleSave} disabled={saving}>
          {saving ? "💾 Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>
    </div>
  );
};

export default Profile;
