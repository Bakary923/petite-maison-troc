import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Signup({ onCancel, onSuccess }) {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !email.trim() || !password) {
      setError('Tous les champs sont requis');
      return;
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    setLoading(true);
    try {
      console.log('[DEBUG SIGNUP] Appel register avec:', { username, email });
      
      const user = await register({ username: username.trim(), email: email.trim(), password });
      
      console.log('[DEBUG SIGNUP] Register réussi, user:', user);
      
      setTimeout(() => {
        console.log('[DEBUG SIGNUP] Redirection vers /');
        navigate('/');
      }, 500);
      
    } catch (err) {
      console.error('[ERROR SIGNUP]', err);
      setError(err.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.formWrapper}>
          <div style={styles.formHeader}>
            <h1 style={styles.title}>Créer un compte</h1>
            <p style={styles.subtitle}>Rejoins la communauté du troc</p>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Affichage des erreurs */}
            {error && (
              <div style={styles.errorBox}>
                <span style={styles.errorIcon}>⚠️</span>
                {error}
              </div>
            )}

            {/* USERNAME */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Nom d'utilisateur</label>
              <input
                type="text"
                placeholder="Mon pseudo"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
              <label style={styles.label}>Email</label>
              <input
                type="email"
                placeholder="ton@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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

            {/* MOT DE PASSE */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Mot de passe</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

            {/* CONFIRMATION MOT DE PASSE */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Confirmer le mot de passe</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
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

            {/* BOUTONS */}
            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.submitButton,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.background = 'radial-gradient(circle at 0 0, rgba(249,115,22,0.5), rgba(249,115,22,1))';
                  e.target.style.boxShadow = '0 0 32px rgba(249,115,22,0.8)';
                  e.target.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'radial-gradient(circle at 0 0, rgba(249,115,22,0.4), rgba(249,115,22,0.95))';
                e.target.style.boxShadow = '0 0 28px rgba(249,115,22,0.6)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              {loading ? 'Inscription en cours...' : "S'inscrire"}
            </button>

            {/* LIEN RETOUR LOGIN */}
            <div style={styles.footer}>
              <p style={styles.footerText}>
                Tu as déjà un compte ?{' '}
                <button
                  type="button"
                  onClick={() => {
                    if (typeof onCancel === 'function') onCancel();
                  }}
                  style={styles.loginLink}
                >
                  Se connecter
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background:
      'radial-gradient(circle at 0% 0%, #1f2937 0, transparent 50%), radial-gradient(circle at 100% 100%, #7f1d1d 0, transparent 50%), linear-gradient(135deg, #020617, #020617)',
    color: '#F9FAFB',
    padding: '60px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    width: '100%',
    maxWidth: '420px',
  },
  formWrapper: {
    borderRadius: 28,
    border: '1px solid rgba(148, 163, 184, 0.4)',
    background: 'rgba(15, 23, 42, 0.92)',
    boxShadow: '0 32px 100px rgba(0, 0, 0, 0.85)',
    padding: 40,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  },
  formHeader: {
    marginBottom: 32,
    textAlign: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 700,
    margin: '0 0 12px 0',
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    margin: 0,
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
    fontSize: 14,
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
  submitButton: {
    padding: '14px 32px',
    borderRadius: 999,
    border: 'none',
    background: 'radial-gradient(circle at 0 0, rgba(249,115,22,0.4), rgba(249,115,22,0.95))',
    color: '#020617',
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    boxShadow: '0 0 28px rgba(249,115,22,0.6)',
    transition: 'all 0.25s ease',
  },
  footer: {
    textAlign: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#9CA3AF',
    margin: 0,
  },
  loginLink: {
    background: 'none',
    border: 'none',
    color: '#f97316',
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'underline',
    transition: 'color 0.2s ease',
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
  },
  errorIcon: {
    fontSize: 16,
  },
};
