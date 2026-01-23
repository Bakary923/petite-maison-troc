import React, { useState } from 'react';
import '../styles/AdminCard.css';

function AdminCard({ annonce, onValidate, onReject, onDelete }) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const handleRejectSubmit = (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      alert('Veuillez entrer une raison');
      return;
    }
    onReject(annonce.id, rejectionReason);
    setShowRejectForm(false);
    setRejectionReason('');
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: '⏳ En attente',
      validated: '✅ Validée',
      rejected: '❌ Rejetée'
    };
    return badges[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ffc107',
      validated: '#28a745',
      rejected: '#dc3545'
    };
    return colors[status] || '#6c757d';
  };

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <div>
          <h3>{annonce.titre}</h3>
          <p className="author">👤 {annonce.username}</p>
        </div>
        <span
          className="status-badge"
          style={{ backgroundColor: getStatusColor(annonce.status) }}
        >
          {getStatusBadge(annonce.status)}
        </span>
      </div>

      <div className="admin-card-body">
        {annonce.image && (
          <img src={annonce.image} alt={annonce.titre} className="admin-card-image" />
        )}
        <p className="description">{annonce.description}</p>

        <div className="annonce-meta">
          <small>📅 {new Date(annonce.created_at).toLocaleDateString('fr-FR')}</small>
          {annonce.rejection_reason && (
            <small className="rejection-reason">
              Raison du rejet : {annonce.rejection_reason}
            </small>
          )}
        </div>
      </div>

      <div className="admin-card-actions">
        {annonce.status === 'pending' && (
          <>
            <button
              className="btn btn-success"
              onClick={() => onValidate(annonce.id)}
            >
              ✅ Valider
            </button>
            <button
              className="btn btn-warning"
              onClick={() => setShowRejectForm(!showRejectForm)}
            >
              ❌ Rejeter
            </button>
          </>
        )}
        <button
          className="btn btn-danger"
          onClick={() => onDelete(annonce.id)}
        >
          🗑️ Supprimer
        </button>
      </div>

      {showRejectForm && (
        <form className="reject-form" onSubmit={handleRejectSubmit}>
          <input
            type="text"
            placeholder="Raison du rejet..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            required
          />
          <button type="submit">Confirmer le rejet</button>
          <button
            type="button"
            className="btn-cancel"
            onClick={() => setShowRejectForm(false)}
          >
            Annuler
          </button>
        </form>
      )}
    </div>
  );
}

export default AdminCard;
