import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      {/* Hero Section */}
      <section style={styles.hero}>
        <h1 style={styles.title}>Bienvenue sur Petite Maison du Troc</h1>
        <p style={styles.subtitle}>
          Échangez, donnez, recevez des objets gratuitement dans votre communauté
        </p>
        
        {/* Boutons Call-to-Action */}
        <div style={styles.buttons}>
          <button 
            onClick={() => navigate('/annonces')}
            style={styles.primaryButton}
          >
            Voir les annonces 📋
          </button>
          <button 
            onClick={() => navigate('/signup')}
            style={styles.secondaryButton}
          >
            Créer un compte 📝
          </button>
        </div>
      </section>

      {/* Fonctionnalités */}
      <section style={styles.features}>
        <h2>Comment ça marche ?</h2>
        <div style={styles.featureGrid}>
          <div style={styles.featureCard}>
            <h3>1️⃣ S'inscrire</h3>
            <p>Créez un compte en 2 minutes</p>
          </div>
          <div style={styles.featureCard}>
            <h3>2️⃣ Publier</h3>
            <p>Partagez les objets que vous n'utilisez plus</p>
          </div>
          <div style={styles.featureCard}>
            <h3>3️⃣ Échanger</h3>
            <p>Connectez-vous avec d'autres membres</p>
          </div>
        </div>
      </section>

      {/* Appel à l'action final */}
      <section style={styles.cta}>
        <h2>Prêt à commencer ?</h2>
        <button 
          onClick={() => navigate('/signup')}
          style={styles.ctaButton}
        >
          Rejoins-nous maintenant ! 🚀
        </button>
      </section>
    </div>
  );
}

// Styles
const styles = {
  container: {
    width: '100%',
    backgroundColor: '#f5f5f5'
  },
  hero: {
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    textAlign: 'center',
    padding: '80px 20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  title: {
    fontSize: '48px',
    margin: '0 0 20px 0',
    fontWeight: 'bold'
  },
  subtitle: {
    fontSize: '18px',
    margin: '0 0 40px 0',
    opacity: 0.9
  },
  buttons: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  primaryButton: {
    padding: '12px 30px',
    fontSize: '16px',
    backgroundColor: 'white',
    color: '#667eea',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'transform 0.3s'
  },
  secondaryButton: {
    padding: '12px 30px',
    fontSize: '16px',
    backgroundColor: 'transparent',
    color: 'white',
    border: '2px solid white',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'transform 0.3s'
  },
  features: {
    maxWidth: '1200px',
    margin: '80px auto',
    padding: '0 20px'
  },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '30px',
    marginTop: '40px'
  },
  featureCard: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    textAlign: 'center'
  },
  cta: {
    backgroundColor: '#2c3e50',
    color: 'white',
    textAlign: 'center',
    padding: '60px 20px',
    marginTop: '80px'
  },
  ctaButton: {
    padding: '15px 40px',
    fontSize: '18px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginTop: '20px'
  }
};
