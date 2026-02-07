import React, { useState } from 'react';

export default function ContactModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    sujet: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      console.log('Message envoyé:', formData);
      setSuccess(true);
      setFormData({ nom: '', email: '', sujet: '', message: '' });
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError('Erreur lors de l\'envoi du message');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div style={styles.backdrop} onClick={onClose} />
      <div style={styles.modal} className="modal-container">
        <div style={styles.header}>
          <h2 style={styles.title}>Nous contacter</h2>
          <button
            onClick={onClose}
            style={styles.closeBtn}
            className="modal-close-icon"
          >
            ✕
          </button>
        </div>

        <div style={styles.content}>
          {success ? (
            <div style={styles.successBox}>
              <p style={styles.successIcon}>✓</p>
              <p style={styles.successText}>Message envoyé avec succès !</p>
              <p style={styles.successSubtext}>Nous vous répondrons au plus vite.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={styles.form} className="modal-form">
              {error && (
                <div style={styles.errorBox}>
                  <span>⚠️</span> {error}
                </div>
              )}

              <div style={styles.formGroup}>
                <label style={styles.label}>Nom *</label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  placeholder="Ton nom"
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="ton@email.com"
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Sujet *</label>
                <input
                  type="text"
                  name="sujet"
                  value={formData.sujet}
                  onChange={handleChange}
                  placeholder="Ex: Question sur le troc"
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Message *</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Ton message..."
                  required
                  rows={4}
                  style={styles.textarea}
                />
              </div>

              <div style={styles.actions} className="modal-actions">
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    ...styles.submitBtn,
                    opacity: loading ? 0.6 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                  className="btn-modal-submit"
                >
                  {loading ? 'Envoi...' : '📤 Envoyer'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  style={styles.cancelBtn}
                  className="btn-modal-cancel"
                >
                  Annuler
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

const styles = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(8px)',
    zIndex: 999,
  },
  modal: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '85vh',
    background: 'radial-gradient(circle at 0% 0%, #1f2937 0, transparent 50%), radial-gradient(circle at 100% 100%, #7f1d1d 0, transparent 50%), linear-gradient(135deg, #020617, #020617)',
    borderRadius: 24,
    border: '1px solid rgba(148, 163, 184, 0.2)',
    boxShadow: '0 40px 100px rgba(0, 0, 0, 0.9)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    padding: '20px 24px',
    borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 22, fontWeight: 700, margin: 0, color: '#F9FAFB' },
  closeBtn: { background: 'transparent', border: 'none', color: '#9CA3AF', fontSize: 24, cursor: 'pointer', padding: 8 },
  content: { padding: '24px', overflowY: 'auto', flex: 1 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  formGroup: { display: 'flex', flexDirection: 'column', gap: 8 },
  label: { fontSize: 12, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: { padding: '12px', borderRadius: 10, border: '1px solid rgba(31, 41, 55, 0.9)', background: 'rgba(15, 23, 42, 0.8)', color: '#F9FAFB', fontSize: 14, fontFamily: 'inherit' },
  textarea: { padding: '12px', borderRadius: 10, border: '1px solid rgba(31, 41, 55, 0.9)', background: 'rgba(15, 23, 42, 0.8)', color: '#F9FAFB', fontSize: 14, fontFamily: 'inherit', resize: 'none' },
  actions: { display: 'flex', gap: 12, marginTop: 8 },
  submitBtn: { flex: 1, padding: '12px', borderRadius: 10, border: 'none', background: 'radial-gradient(circle at 0 0, rgba(249,115,22,0.4), rgba(249,115,22,0.95))', color: '#020617', fontSize: 14, fontWeight: 700, boxShadow: '0 0 20px rgba(249,115,22,0.4)' },
  cancelBtn: { flex: 1, padding: '12px', borderRadius: 10, border: '1px solid rgba(148, 163, 184, 0.2)', background: 'transparent', color: '#9CA3AF', fontSize: 14, fontWeight: 600 },
  errorBox: { padding: '10px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', fontSize: 13, marginBottom: 10 },
  successBox: { textAlign: 'center', padding: '30px 10px' },
  successIcon: { fontSize: 40, color: '#22c55e', margin: '0 0 10px 0' },
  successText: { fontSize: 18, fontWeight: 600, color: '#F9FAFB', margin: '0 0 5px 0' },
  successSubtext: { fontSize: 14, color: '#9CA3AF', margin: 0 },
};