import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';


export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();


  const handleAnnoncesClick = () => navigate('/annonces');
  const handleLoginClick = () => navigate('/login');
  const handleSignupClick = () => navigate('/signup');
  const handleAdminClick = () => navigate('/admin');  // ← AJOUTE
  const handleLogout = () => {
    logout();
    navigate('/');
  };


  return (
    <nav style={styles.navbar}>
      <div style={styles.container}>
        <div
          onClick={() => navigate('/')}
          style={styles.logoContainer}
        >
          <div style={styles.logoMark} />
          <span style={styles.logoText}>Petite Maison Épouvante</span>
        </div>


        <div style={styles.menu}>
          <button
            onClick={handleAnnoncesClick}
            style={styles.navLink}
            onMouseEnter={(e) => {
              e.target.style.color = '#f97316';
            }}
            onMouseLeave={(e) => {
              e.target.style.color = '#E5E7EB';
            }}
          >
            Annonces
          </button>


          {user ? (
            <div style={styles.userSection}>
              <span style={styles.username}>Bonsoir, {user.username}</span>
              
              {/* ← AJOUTE : Lien Admin si l'utilisateur est admin */}
              {user.role === 'admin' && (
                <button
                  onClick={handleAdminClick}
                  style={styles.adminButton}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = '#8b5cf6';
                    e.target.style.color = '#c4b5fd';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = 'rgba(139, 92, 246, 0.4)';
                    e.target.style.color = '#e9d5ff';
                  }}
                >
                  🔐 Admin
                </button>
              )}

              <button
                onClick={handleLogout}
                style={styles.logoutButton}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(239, 68, 68, 0.2)';
                  e.target.style.borderColor = '#ef4444';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(127, 29, 29, 0.8)';
                  e.target.style.borderColor = 'rgba(248, 113, 113, 0.4)';
                }}
              >
                Se déconnecter
              </button>
            </div>
          ) : (
            <div style={styles.authButtons}>
              <button
                onClick={handleLoginClick}
                style={styles.secondaryButton}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#f97316';
                  e.target.style.color = '#f97316';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = 'rgba(148, 163, 184, 0.5)';
                  e.target.style.color = '#E5E7EB';
                }}
              >
                Connexion
              </button>
              <button
                onClick={handleSignupClick}
                style={styles.primaryButton}
                onMouseEnter={(e) => {
                  e.target.style.background =
                    'radial-gradient(circle at 0 0, rgba(249,115,22,0.5), rgba(249,115,22,1))';
                  e.target.style.boxShadow = '0 0 32px rgba(249,115,22,0.8)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background =
                    'radial-gradient(circle at 0 0, rgba(249,115,22,0.3), rgba(249,115,22,0.9))';
                  e.target.style.boxShadow = '0 0 22px rgba(249,115,22,0.6)';
                }}
              >
                Créer un compte
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}


const styles = {
  navbar: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    background: 'rgba(2, 6, 23, 0.92)',
    borderBottom: '1px solid rgba(148, 163, 184, 0.12)',
    boxShadow: '0 2px 20px rgba(0, 0, 0, 0.3)',
  },
  container: {
    maxWidth: '1180px',
    margin: '0 auto',
    padding: '16px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    cursor: 'pointer',
    padding: '8px 0',
    transition: 'opacity 0.2s ease',
  },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    boxShadow: '0 8px 24px rgba(249, 115, 22, 0.4)',
    position: 'relative',
  },
  logoText: {
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: '#F9FAFB',
    lineHeight: 1,
  },
  menu: {
    display: 'flex',
    alignItems: 'center',
    gap: 24,
  },
  navLink: {
    background: 'transparent',
    border: 'none',
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: 500,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    padding: '10px 0',
    transition: 'color 0.2s ease',
  },
  primaryButton: {
    padding: '10px 24px',
    borderRadius: 999,
    border: '1px solid rgba(249, 115, 22, 0.4)',
    background:
      'radial-gradient(circle at 0 0, rgba(249,115,22,0.3), rgba(249,115,22,0.9))',
    color: '#020617',
    fontSize: 13,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.14em',
    cursor: 'pointer',
    boxShadow: '0 0 22px rgba(249,115,22,0.6)',
    transition: 'all 0.2s ease',
  },
  secondaryButton: {
    padding: '10px 24px',
    borderRadius: 999,
    border: '1px solid rgba(148, 163, 184, 0.5)',
    background: 'transparent',
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  username: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: 500,
  },
  adminButton: {  // ← AJOUTE
    padding: '8px 16px',
    borderRadius: 999,
    border: '1px solid rgba(139, 92, 246, 0.4)',
    background: 'rgba(59, 13, 152, 0.3)',
    color: '#e9d5ff',
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  logoutButton: {
    padding: '8px 16px',
    borderRadius: 999,
    border: '1px solid rgba(248, 113, 113, 0.4)',
    background: 'rgba(127, 29, 29, 0.8)',
    color: '#FEE2E2',
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  authButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
};
