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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Pour le moment, simule juste l'envoi
      // Plus tard tu peux connecter à un backend
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
      {/* Backdrop */}
      <div
        style={styles.backdrop}
        onClick={onClose}
      />

      {/* Modal */}
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>Nous contacter</h2>
          <button
            onClick={onClose}
            style={styles.closeBtn}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(107,114,128,0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
            }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={styles.content}>
          {success ? (
            <div style={styles.successBox}>
              <p style={styles.successIcon}>✓</p>
              <p style={styles.successText}>Message envoyé avec succès !</p>
              <p style={styles.successSubtext}>Nous vous répondrons au plus vite.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={styles.form}>
              {error && (
                <div style={styles.errorBox}>
                  <span>⚠️</span> {error}
                </div>
              )}

              {/* NOM */}
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
                  onFocus={(e) => {
                    e.target.style.borderColor = '#f97316';
                    e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(31, 41, 55, 0.9)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* EMAIL */}
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
                  onFocus={(e) => {
                    e.target.style.borderColor = '#f97316';
                    e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(31, 41, 55, 0.9)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* SUJET */}
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
                  onFocus={(e) => {
                    e.target.style.borderColor = '#f97316';
                    e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(31, 41, 55, 0.9)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* MESSAGE */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Message *</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Ton message..."
                  required
                  rows={5}
                  style={styles.textarea}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#f97316';
                    e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(31, 41, 55, 0.9)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* BOUTONS */}
              <div style={styles.actions}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    ...styles.submitBtn,
                    opacity: loading ? 0.6 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.target.style.background = 'radial-gradient(circle at 0 0, rgba(249,115,22,0.5), rgba(249,115,22,1))';
                      e.target.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'radial-gradient(circle at 0 0, rgba(249,115,22,0.4), rgba(249,115,22,0.95))';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  {loading ? 'Envoi en cours...' : '📤 Envoyer'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  style={styles.cancelBtn}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(107,114,128,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent';
                  }}
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
    background: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(4px)',
    zIndex: 999,
  },
  modal: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    background:
      'radial-gradient(circle at 0% 0%, #1f2937 0, transparent 50%), radial-gradient(circle at 100% 100%, #7f1d1d 0, transparent 50%), linear-gradient(135deg, #020617, #020617)',
    borderRadius: 28,
    border: '1px solid rgba(148, 163, 184, 0.2)',
    boxShadow: '0 40px 100px rgba(0, 0, 0, 0.9)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    padding: '24px',
    borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    margin: 0,
    color: '#F9FAFB',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: '#9CA3AF',
    fontSize: 24,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    padding: 8,
    borderRadius: 8,
  },
  content: {
    padding: '24px',
    overflowY: 'auto',
    flex: 1,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: '#E5E7EB',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  input: {
    padding: '12px 16px',
    borderRadius: 12,
    border: '1px solid rgba(31, 41, 55, 0.9)',
    background: 'rgba(15, 23, 42, 0.8)',
    color: '#F9FAFB',
    fontSize: 14,
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
  },
  textarea: {
    padding: '12px 16px',
    borderRadius: 12,
    border: '1px solid rgba(31, 41, 55, 0.9)',
    background: 'rgba(15, 23, 42, 0.8)',
    color: '#F9FAFB',
    fontSize: 14,
    fontFamily: 'inherit',
    resize: 'vertical',
    transition: 'all 0.2s ease',
  },
  actions: {
    display: 'flex',
    gap: 12,
    marginTop: 8,
  },
  submitBtn: {
    flex: 1,
    padding: '12px 16px',
    borderRadius: 12,
    border: 'none',
    background: 'radial-gradient(circle at 0 0, rgba(249,115,22,0.4), rgba(249,115,22,0.95))',
    color: '#020617',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    boxShadow: '0 0 20px rgba(249,115,22,0.5)',
  },
  cancelBtn: {
    flex: 1,
    padding: '12px 16px',
    borderRadius: 12,
    border: '1px solid rgba(148, 163, 184, 0.2)',
    background: 'transparent',
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  errorBox: {
    padding: '12px 16px',
    borderRadius: 12,
    border: '1px solid rgba(239, 68, 68, 0.5)',
    background: 'rgba(239, 68, 68, 0.15)',
    color: '#fecaca',
    fontSize: 14,
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  successBox: {
    textAlign: 'center',
    padding: '40px 20px',
  },
  successIcon: {
    fontSize: 48,
    color: '#22c55e',
    margin: '0 0 16px 0',
  },
  successText: {
    fontSize: 18,
    fontWeight: 600,
    color: '#F9FAFB',
    margin: '0 0 8px 0',
  },
  successSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    margin: 0,
  },
};
