import React, { useState } from 'react';
import '../assets/Patients.css';

const Pasien = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Data contoh pasien
  const [patients] = useState([
    {
      id: 'P001',
      rm: 'RM001',
      name: 'Ahmad Wijaya',
      age: 45,
      gender: 'Laki-laki',
      diagnosis: 'Diabetes Mellitus',
      status: 'Rawat Inap',
      avatar: 'A'
    },
    {
      id: 'P002',
      rm: 'RM002',
      name: 'Siti Aminah',
      age: 32,
      gender: 'Perempuan',
      diagnosis: 'Hipertensi',
      status: 'Rawat Jalan',
      avatar: 'S'
    },
    {
      id: 'P003',
      rm: 'RM003',
      name: 'Budi Santoso',
      age: 58,
      gender: 'Laki-laki',
      diagnosis: 'Stroke',
      status: 'Pulang',
      avatar: 'B'
    },
    {
      id: 'P004',
      rm: 'RM004',
      name: 'Dewi Lestari',
      age: 28,
      gender: 'Perempuan',
      diagnosis: 'Pneumonia',
      status: 'Rawat Inap',
      avatar: 'D'
    },
    {
      id: 'P005',
      rm: 'RM005',
      name: 'Joko Susilo',
      age: 41,
      gender: 'Laki-laki',
      diagnosis: 'Gastritis',
      status: 'Rawat Jalan',
      avatar: 'J'
    }
  ]);

  // Filter pasien berdasarkan pencarian dan status
  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.rm.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.diagnosis.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || patient.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusClass = (status) => {
    switch (status) {
      case 'Rawat Inap':
        return 'active';
      case 'Rawat Jalan':
        return 'outpatient';
      case 'Pulang':
        return 'discharged';
      default:
        return '';
    }
  };

  const handleAddPatient = () => {
    // Logic untuk menambah pasien baru
    console.log('Menambah pasien baru');
  };

  const handleViewPatient = (patient) => {
    // Logic untuk melihat detail pasien
    console.log('Melihat detail pasien:', patient);
  };

  const handleEditPatient = (patient) => {
    // Logic untuk mengedit pasien
    console.log('Mengedit pasien:', patient);
  };

  const handleCreateAskep = (patient) => {
    // Logic untuk membuat askep
    console.log('Membuat askep untuk pasien:', patient);
  };

  const handleViewReport = (patient) => {
    // Logic untuk melihat laporan
    console.log('Melihat laporan pasien:', patient);
  };

  return (
    <div className="dashboard-content">
      <div className="page-header">
        <div className="header-content">
          <h1>Data Pasien</h1>
          <p className="header-subtitle">Kelola dan pantau informasi pasien</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={handleAddPatient}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            Tambah Pasien
          </button>
        </div>
      </div>

      <div className="patients-stats">
        <div className="stat-card-small">
          <div className="stat-icon-small patients">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 8c0 2.21-1.79 4-4 4s-4-1.79-4-4 1.79-4 4-4 4 1.79 4 4z"/>
              <path d="M12 14c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z"/>
            </svg>
          </div>
          <div className="stat-content-small">
            <h4>Total Pasien</h4>
            <p>{patients.length}</p>
          </div>
        </div>
        
        <div className="stat-card-small">
          <div className="stat-icon-small active">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
              <line x1="9" y1="9" x2="9.01" y2="9"/>
              <line x1="15" y1="9" x2="15.01" y2="9"/>
            </svg>
          </div>
          <div className="stat-content-small">
            <h4>Aktif Hari Ini</h4>
            <p>{patients.filter(p => p.status === 'Rawat Inap').length}</p>
          </div>
        </div>
        
        <div className="stat-card-small">
          <div className="stat-icon-small new">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9l-5.91 5.74L18 22l-6-3.15L6 22l1.91-7.26L2 9l6.91-1.74L12 2z"/>
            </svg>
          </div>
          <div className="stat-content-small">
            <h4>Pasien Baru</h4>
            <p>{patients.filter(p => p.status === 'Rawat Jalan').length}</p>
          </div>
        </div>
      </div>

      <div className="patients-section">
        <div className="section-header">
          <h3 className="section-title">Daftar Pasien</h3>
          <div className="search-filter">
            <div className="search-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <input 
                type="text" 
                placeholder="Cari pasien..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Semua Status</option>
              <option value="Rawat Inap">Rawat Inap</option>
              <option value="Rawat Jalan">Rawat Jalan</option>
              <option value="Pulang">Pulang</option>
            </select>
          </div>
        </div>

        <div className="patients-table">
          <div className="table-header">
            <div className="th">No. RM</div>
            <div className="th">Nama Pasien</div>
            <div className="th">Usia</div>
            <div className="th">Jenis Kelamin</div>
            <div className="th">Diagnosis</div>
            <div className="th">Status</div>
            <div className="th">Aksi</div>
          </div>
          
          <div className="table-body">
            {filteredPatients.length === 0 ? (
              <div className="table-row">
                <div className="td" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>
                  <p>Tidak ada pasien yang ditemukan</p>
                </div>
              </div>
            ) : (
              filteredPatients.map((patient) => (
                <div key={patient.id} className="table-row">
                  <div className="td">{patient.rm}</div>
                  <div className="td">
                    <div className="patient-info">
                      <div className="patient-avatar">{patient.avatar}</div>
                      <div>
                        <span className="patient-name">{patient.name}</span>
                        <span className="patient-id">ID: {patient.id}</span>
                      </div>
                    </div>
                  </div>
                  <div className="td">{patient.age} tahun</div>
                  <div className="td">{patient.gender}</div>
                  <div className="td">{patient.diagnosis}</div>
                  <div className="td">
                    <span className={`status-badge ${getStatusClass(patient.status)}`}>
                      {patient.status}
                    </span>
                  </div>
                  <div className="td">
                    <div className="action-buttons">
                      <button 
                        className="btn-action view" 
                        title="Lihat Detail"
                        onClick={() => handleViewPatient(patient)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                        </svg>
                      </button>
                      <button 
                        className="btn-action edit" 
                        title="Edit"
                        onClick={() => handleEditPatient(patient)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                        </svg>
                      </button>
                      {patient.status === 'Pulang' ? (
                        <button 
                          className="btn-action report" 
                          title="Lihat Laporan"
                          onClick={() => handleViewReport(patient)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h8c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                          </svg>
                        </button>
                      ) : (
                        <button 
                          className="btn-action askep" 
                          title="Buat Askep"
                          onClick={() => handleCreateAskep(patient)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="pagination">
          <button className="pagination-btn" disabled>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
            Previous
          </button>
          <div className="pagination-numbers">
            <button className="pagination-number active">1</button>
            <button className="pagination-number">2</button>
            <button className="pagination-number">3</button>
            <span>...</span>
            <button className="pagination-number">10</button>
          </div>
          <button className="pagination-btn">
            Next
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pasien;
