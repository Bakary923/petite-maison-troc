import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ContactModal from './ContactModal';

export default function Footer() {
  const navigate = useNavigate();
  const [showContactModal, setShowContactModal] = useState(false);

  return (
    <>
      <footer style={styles.footer}>
        <div style={styles.container} className="footer-container">
          {/* TOP SECTION */}
          <div style={styles.topSection} className="footer-top-section">
            <div style={styles.column} className="footer-column">
              <div style={styles.logoSection} className="footer-logo-wrap">
                <div style={styles.logo}>
                  <div style={styles.logoSquare} />
                </div>
                <div>
                  <h3 style={styles.logoText}>La Petite Maison Épouvante</h3>
                  <p style={styles.tagline}>Plateforme de troc communautaire</p>
                </div>
              </div>
              <p style={styles.description}>
                Échangez, donnez et recevez dans votre communauté. Une plateforme moderne pour partager responsablement.
              </p>
            </div>

            {/* LINKS SECTION */}
            <div style={styles.column} className="footer-column">
              <h4 style={styles.columnTitle}>Navigation</h4>
              <ul style={styles.linkList}>
                <li>
                  <button
                    onClick={() => navigate('/')}
                    style={styles.link}
                    onMouseEnter={(e) => (e.target.style.color = '#f97316')}
                    onMouseLeave={(e) => (e.target.style.color = '#9CA3AF')}
                  >
                    Accueil
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/annonces')}
                    style={styles.link}
                    onMouseEnter={(e) => (e.target.style.color = '#f97316')}
                    onMouseLeave={(e) => (e.target.style.color = '#9CA3AF')}
                  >
                    Annonces
                  </button>
                </li>
              </ul>
            </div>

            {/* INFO SECTION */}
            <div style={styles.column} className="footer-column">
              <h4 style={styles.columnTitle}>Informations</h4>
              <ul style={styles.linkList}>
                <li>
                  <button onClick={() => setShowContactModal(true)} style={styles.link}>
                    Nous contacter
                  </button>
                </li>
              </ul>
            </div>

            {/* SOCIALS SECTION */}
            <div style={styles.column} className="footer-column">
              <h4 style={styles.columnTitle}>Suivez-nous</h4>
              <div style={styles.socialLinks} className="footer-socials">
                <a href="#" style={styles.socialButton} title="Facebook">f</a>
                <a href="#" style={styles.socialButton} title="Twitter">𝕏</a>
                <a href="#" style={styles.socialButton} title="Instagram">📷</a>
              </div>
            </div>
          </div>

          <div style={styles.divider} />

          {/* BOTTOM SECTION */}
          <div style={styles.bottomSection} className="footer-bottom-bar">
            <p style={styles.copyright}>
              © 2026 La Petite Maison Épouvante. Tous droits réservés.
            </p>
            <div style={styles.bottomLinks}>
              <button style={styles.bottomLink}>Conditions</button>
              <span style={styles.separator}>•</span>
              <button style={styles.bottomLink}>Confidentialité</button>
            </div>
          </div>
        </div>
      </footer>

      <ContactModal 
        isOpen={showContactModal} 
        onClose={() => setShowContactModal(false)} 
      />
    </>
  );
}

const styles = {
  footer: {
    background: 'radial-gradient(circle at 0% 0%, #1f2937 0, transparent 50%), radial-gradient(circle at 100% 100%, #7f1d1d 0, transparent 50%), linear-gradient(135deg, #020617, #020617)',
    borderTop: '1px solid rgba(148, 163, 184, 0.2)',
    color: '#F9FAFB',
    padding: '60px 20px 30px',
    marginTop: 'auto',
  },
  container: {
    maxWidth: '1180px',
    margin: '0 auto',
  },
  topSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 40,
    marginBottom: 40,
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  logoSection: {
    display: 'flex',
    gap: 12,
    alignItems: 'flex-start',
  },
  logo: {
    lineHeight: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoSquare: {
    width: 32,
    height: 32,
    background: 'radial-gradient(circle at 0 0, rgba(249,115,22,0.5), rgba(249,115,22,1))',
    borderRadius: 8,
    boxShadow: '0 0 20px rgba(249,115,22,0.6)',
  },
  logoText: {
    fontSize: 18,
    fontWeight: 700,
    margin: '0 0 4px 0',
    color: '#F9FAFB',
  },
  tagline: {
    fontSize: 12,
    color: '#9CA3AF',
    margin: 0,
    fontWeight: 500,
  },
  description: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 1.6,
    margin: 0,
  },
  columnTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#F9FAFB',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    margin: '0 0 12px 0',
  },
  linkList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  link: {
    background: 'none',
    border: 'none',
    color: '#9CA3AF',
    fontSize: 14,
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'color 0.2s ease',
    padding: 0,
    fontFamily: 'inherit',
    textAlign: 'left',
  },
  socialLinks: {
    display: 'flex',
    gap: 12,
  },
  socialButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    border: '1px solid rgba(148, 163, 184, 0.3)',
    background: 'rgba(15, 23, 42, 0.8)',
    color: '#9CA3AF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    textDecoration: 'none',
    transition: 'all 0.2s ease',
  },
  divider: {
    height: '1px',
    background: 'rgba(148, 163, 184, 0.1)',
    marginBottom: 30,
  },
  bottomSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    textAlign: 'center',
  },
  copyright: {
    fontSize: 12,
    color: '#6B7280',
    margin: 0,
  },
  bottomLinks: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  bottomLink: {
    fontSize: 12,
    color: '#9CA3AF',
    textDecoration: 'none',
    transition: 'color 0.2s ease',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    fontFamily: 'inherit',
    padding: 0,
  },
  separator: {
    color: '#6B7280',
  },
};