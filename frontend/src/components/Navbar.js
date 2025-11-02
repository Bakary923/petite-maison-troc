import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Fonction pour cliquer sur "Annonces"
  const handleAnnoncesClick = () => {
    navigate('/annonces'); // Accédez à la page des annonces
  };

  // Fonction pour cliquer sur "Connexion"
  const handleLoginClick = () => {
    navigate('/login');
  };

  // Fonction pour cliquer sur "Inscription"
  const handleSignupClick = () => {
    navigate('/signup');
  };

  // Fonction pour se déconnecter
  const handleLogout = () => {
    logout();
    navigate('/'); // Retour à l'accueil
  };

  return (
    <nav style={styles.navbar}>
      <div style={styles.container}>
        {/* Logo/Titre */}
        <h1 
          onClick={() => navigate('/')} 
          style={styles.logo}
        >
          🏠 Petite Maison du Troc
        </h1>

        {/* Menu */}
        <div style={styles.menu}>
          {/* Bouton Annonces (accessible à tous) */}
          <button 
            onClick={handleAnnoncesClick}
            style={styles.navButton}
          >
            📋 Annonces
          </button>

          {/* Si user est connecté */}
          {user ? (
            <div style={styles.userSection}>
              <span style={styles.username}>Bonjour, {user.username}</span>
              <button 
                onClick={handleLogout}
                style={{...styles.navButton, backgroundColor: '#ff4444'}}
              >
                Se déconnecter
              </button>
            </div>
          ) : (
            // Si user N'est PAS connecté
            <div style={styles.authButtons}>
              <button 
                onClick={handleLoginClick}
                style={styles.navButton}
              >
                🔓 Connexion
              </button>
              <button 
                onClick={handleSignupClick}
                style={{...styles.navButton, backgroundColor: '#4CAF50'}}
              >
                📝 Inscription
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

// Styles
const styles = {
  navbar: {
    backgroundColor: '#2c3e50',
    padding: '15px 0',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px'
  },
  logo: {
    color: 'white',
    margin: 0,
    fontSize: '24px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  menu: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center'
  },
  navButton: {
    padding: '8px 16px',
    backgroundColor: '#0066cc',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'background-color 0.3s'
  },
  userSection: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center'
  },
  authButtons: {
    display: 'flex',
    gap: '10px'
  },
  username: {
    color: 'white',
    fontSize: '14px',
    fontWeight: 'bold'
  }
};
