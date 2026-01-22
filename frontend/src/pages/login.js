import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Signup from './signup';

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSignup, setShowSignup] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ email: email.trim(), password });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Échec de la connexion');
    } finally {
      setLoading(false);
    }
  };

  if (showSignup) {
    return (
      <Signup
        onCancel={() => setShowSignup(false)}
        onSuccess={() => navigate('/')}
      />
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.formWrapper}>
          <div style={styles.formHeader}>
            <h1 style={styles.title}>Bienvenue</h1>
            <p style={styles.subtitle}>Connecte-toi à ton compte</p>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Affichage des erreurs */}
            {error && (
              <div style={styles.errorBox}>
                <span style={styles.errorIcon}>⚠️</span>
                {error}
              </div>
            )}

            {/* EMAIL */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                placeholder="ton@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
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
                autoComplete="current-password"
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

            {/* BOUTON SUBMIT */}
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
              {loading ? 'Connexion en cours...' : 'Se connecter'}
            </button>

            {/* LIEN SIGNUP */}
            <div style={styles.footer}>
              <p style={styles.footerText}>
                Pas encore de compte ?{' '}
                <button
                  type="button"
                  onClick={() => setShowSignup(true)}
                  style={styles.signupLink}
                >
                  Créer un compte
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
    background:
      'radial-gradient(circle at 0% 0%, #1f2937 0, transparent 50%), radial-gradient(circle at 100% 100%, #7f1d1d 0, transparent 50%), linear-gradient(135deg, #020617, #020617)',
    color: '#F9FAFB',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '40px 20px',
  },
  container: {
    width: '100%',
    maxWidth: '420px',
    margin: '0 auto',
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
    gap: 24,
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
  signupLink: {
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
