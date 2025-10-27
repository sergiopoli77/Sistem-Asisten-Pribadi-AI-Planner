import React from 'react';
import '../assets/Login.css';

const ConfirmModal = ({ open, title, message, confirmLabel = 'OK', cancelLabel = 'Batal', loading = false, onConfirm, onCancel }) => {
  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        {title && <h3>{title}</h3>}
        <p style={{ whiteSpace: 'pre-wrap' }}>{message}</p>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onCancel} disabled={loading}>{cancelLabel}</button>
          <button className="btn-save" onClick={onConfirm} disabled={loading}>
            {loading ? (<><div className="spinner" style={{ marginRight: 8 }}></div>Memproses...</>) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
