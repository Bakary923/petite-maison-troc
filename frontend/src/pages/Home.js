import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import hauntedHouse from '../assets/maison_hanté.png'; // À adapter selon ton chemin

export default function Home() {
  const navigate = useNavigate();
  const [annonceCount, setAnnonceCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnonceCount = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/annonces');
        if (res.ok) {
          const data = await res.json();
          setAnnonceCount(data.annonces ? data.annonces.length : 0);
        }
      } catch (err) {
        console.error('Erreur lors du chargement du nombre d\'annonces:', err);
        setAnnonceCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnonceCount();
  }, []);

  return (
    <div style={styles.page}>
      {/* HERO */}
      <section style={styles.hero}>
        <div style={styles.heroInner}>
          <div style={styles.heroLeft}>
            <span style={styles.pill}>
              ● Plateforme de troc communautaire
            </span>

            <h1 style={styles.title}>
              La maison <span style={styles.titleAccent}>où rien ne se jette</span>.
            </h1>

            <p style={styles.subtitle}>
              Un espace numérique sombre et épuré pour échanger, donner et recevoir des objets dans votre communauté avec une interface moderne et minimaliste.
            </p>

            <div style={styles.actions}>
              <button
                onClick={() => navigate('/annonces')}
                style={styles.primaryButton}
                onMouseEnter={(e) => {
                  e.target.style.background =
                    'radial-gradient(circle at 0 0, rgba(249,115,22,0.5), rgba(249,115,22,1))';
                  e.target.style.boxShadow = '0 0 32px rgba(249,115,22,0.8)';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background =
                    'radial-gradient(circle at 0 0, rgba(249,115,22,0.4), rgba(249,115,22,0.95))';
                  e.target.style.boxShadow = '0 0 28px rgba(249,115,22,0.6)';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                Voir les annonces
              </button>
              <button
                onClick={() => navigate('/signup')}
                style={styles.secondaryButton}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#f97316';
                  e.target.style.color = '#f97316';
                  e.target.style.background = 'rgba(249,115,22,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = 'rgba(148, 163, 184, 0.6)';
                  e.target.style.color = '#E5E7EB';
                  e.target.style.background = 'transparent';
                }}
              >
                Créer un compte
              </button>
            </div>
          </div>

          <div style={styles.heroRight}>
            <div style={styles.glowOrange} />
            <div style={styles.glowBlue} />
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.cardTitle}>Catalogue des annonces</span>
                <span style={styles.cardBadge}>
                  {loading ? '...' : `${annonceCount} annonce${annonceCount > 1 ? 's' : ''}`}
                </span>
              </div>
              
              {/* IMAGE À LA PLACE DU SVG */}
              <div style={styles.cardBody}>
                <img 
                  src={hauntedHouse}
                  alt="Maison hantée"
                  style={styles.hauntedImage}
                />
              </div>

              <p style={styles.cardText}>
                Parcourez des milliers d'objets, une interface épurée pour une meilleure expérience d'échange.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION COMMENT ÇA MARCHE */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Comment ça marche ?</h2>
          <p style={styles.sectionSubtitle}>
            Trois étapes pour faire vivre la maison du troc.
          </p>
        </div>

        <div style={styles.featureGrid}>
          <div
            style={styles.featureCard}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)';
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 20px 48px rgba(249,115,22,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(31, 41, 55, 0.9)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 18px 40px rgba(0, 0, 0, 0.7)';
            }}
          >
            <span style={styles.step}>1</span>
            <h3 style={styles.featureTitle}>Créer ton profil</h3>
            <p style={styles.featureText}>
              Rejoins la communauté en quelques secondes avec un compte sécurisé.
            </p>
          </div>

          <div
            style={styles.featureCard}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)';
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 20px 48px rgba(249,115,22,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(31, 41, 55, 0.9)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 18px 40px rgba(0, 0, 0, 0.7)';
            }}
          >
            <span style={styles.step}>2</span>
            <h3 style={styles.featureTitle}>Publier un objet</h3>
            <p style={styles.featureText}>
              Partagez vos articles inutilisés à travers des annonces claires et professionnelles.
            </p>
          </div>

          <div
            style={styles.featureCard}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(249,115,22,0.5)';
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 20px 48px rgba(249,115,22,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(31, 41, 55, 0.9)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 18px 40px rgba(0, 0, 0, 0.7)';
            }}
          >
            <span style={styles.step}>3</span>
            <h3 style={styles.featureTitle}>Échanger et discuter</h3>
            <p style={styles.featureText}>
              Connectez-vous avec d'autres membres et réalisez vos trocs simplement.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={styles.cta}>
        <div style={styles.ctaInner}>
          <div>
            <h2 style={styles.ctaTitle}>Prêt à entrer dans la maison ?</h2>
            <p style={styles.ctaText}>
              Créez votre compte aujourd'hui et rejoignez une communauté engagée dans l'échange et le partage responsable.
            </p>
          </div>
          <button
            onClick={() => navigate('/signup')}
            style={styles.ctaButton}
            onMouseEnter={(e) => {
              e.target.style.background = 'linear-gradient(135deg, #1a2a3a, #0a1420)';
              e.target.style.boxShadow = '0 0 28px rgba(249,115,22,0.4)';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#0b0f19';
              e.target.style.boxShadow = '0 0 22px rgba(15, 23, 42, 0.9)';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            Rejoindre maintenant
          </button>
        </div>
      </section>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background:
      'radial-gradient(circle at 0% 0%, #1f2937 0, transparent 50%), radial-gradient(circle at 100% 100%, #7f1d1d 0, transparent 50%), linear-gradient(135deg, #020617, #020617)',
    color: '#F9FAFB',
  },
  hero: {
    padding: '100px 20px 60px',
  },
  heroInner: {
    maxWidth: '1180px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)',
    gap: 60,
    alignItems: 'center',
  },
  heroLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: 28,
  },
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    padding: '8px 18px',
    border: '1px solid rgba(148, 163, 184, 0.4)',
    background: 'rgba(15, 23, 42, 0.9)',
    fontSize: 11,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    color: '#9CA3AF',
    fontWeight: 500,
    width: 'fit-content',
  },
  title: {
    fontSize: 52,
    lineHeight: 1.08,
    fontWeight: 700,
    letterSpacing: '-0.02em',
    margin: 0,
  },
  titleAccent: {
    color: '#f97316',
    background: 'linear-gradient(135deg, #f97316, #ea580c)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 18,
    color: '#9CA3AF',
    maxWidth: 520,
    lineHeight: 1.6,
    fontWeight: 400,
  },
  actions: {
    marginTop: 24,
    display: 'flex',
    flexWrap: 'wrap',
    gap: 16,
  },
  primaryButton: {
    padding: '14px 32px',
    borderRadius: 999,
    border: 'none',
    background:
      'radial-gradient(circle at 0 0, rgba(249,115,22,0.4), rgba(249,115,22,0.95))',
    color: '#020617',
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    boxShadow: '0 0 28px rgba(249,115,22,0.6)',
    transition: 'all 0.25s ease',
  },
  secondaryButton: {
    padding: '14px 32px',
    borderRadius: 999,
    border: '1px solid rgba(148, 163, 184, 0.6)',
    background: 'transparent',
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
  },
  heroRight: {
    position: 'relative',
    minHeight: 320,
  },
  glowOrange: {
    position: 'absolute',
    right: -60,
    top: -60,
    width: 200,
    height: 200,
    borderRadius: '999px',
    background: 'rgba(249, 115, 22, 0.25)',
    filter: 'blur(80px)',
    pointerEvents: 'none',
  },
  glowBlue: {
    position: 'absolute',
    left: -60,
    bottom: -60,
    width: 220,
    height: 220,
    borderRadius: '999px',
    background: 'rgba(59, 130, 246, 0.25)',
    filter: 'blur(90px)',
    pointerEvents: 'none',
  },
  card: {
    position: 'relative',
    borderRadius: 28,
    border: '1px solid rgba(148, 163, 184, 0.4)',
    background: 'rgba(15, 23, 42, 0.92)',
    boxShadow: '0 32px 100px rgba(0, 0, 0, 0.85)',
    padding: 28,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#F9FAFB',
  },
  cardBadge: {
    padding: '6px 14px',
    borderRadius: 999,
    fontSize: 11,
    background: 'rgba(22, 163, 74, 0.2)',
    color: '#bbf7d0',
    border: '1px solid rgba(34, 197, 94, 0.4)',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  cardBody: {
    borderRadius: 20,
    border: '1px solid rgba(55, 65, 81, 0.9)',
    background:
      'linear-gradient(145deg, rgba(248, 250, 252, 0.08), rgba(248, 250, 252, 0.02))',
    aspectRatio: '4 / 3',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    position: 'relative',
    overflow: 'hidden',
  },
  hauntedImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: 16,
  },
  cardText: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 1.6,
    margin: 0,
  },
  section: {
    maxWidth: '1180px',
    margin: '80px auto',
    padding: '0 20px',
  },
  sectionHeader: {
    marginBottom: 48,
  },
  sectionTitle: {
    fontSize: 36,
    fontWeight: 700,
    letterSpacing: '-0.01em',
    margin: '0 0 12px 0',
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    margin: 0,
    fontWeight: 400,
  },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 24,
  },
  featureCard: {
    position: 'relative',
    borderRadius: 20,
    border: '1px solid rgba(31, 41, 55, 0.9)',
    background: 'rgba(15, 23, 42, 0.96)',
    padding: 28,
    boxShadow: '0 18px 40px rgba(0, 0, 0, 0.7)',
    transition: 'all 0.3s ease',
  },
  step: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 999,
    border: '1px solid rgba(148, 163, 184, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 700,
    color: '#9CA3AF',
    background: 'rgba(15,23,42,0.8)',
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 12,
    margin: '0 0 12px 0',
  },
  featureText: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 1.6,
    margin: 0,
  },
  cta: {
    padding: '0 20px 100px',
  },
  ctaInner: {
    maxWidth: '1180px',
    margin: '0 auto',
    borderRadius: 28,
    border: '1px solid rgba(248, 250, 252, 0.12)',
    background:
      'radial-gradient(circle at 0% 0%, rgba(249,115,22,0.2), transparent 45%), radial-gradient(circle at 100% 100%, rgba(59,130,246,0.2), transparent 45%), rgba(15, 23, 42, 0.98)',
    padding: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 32,
  },
  ctaTitle: {
    fontSize: 28,
    fontWeight: 700,
    margin: '0 0 12px 0',
  },
  ctaText: {
    fontSize: 16,
    color: '#E5E7EB',
    maxWidth: 500,
    margin: 0,
    lineHeight: 1.6,
  },
  ctaButton: {
    padding: '14px 32px',
    borderRadius: 999,
    border: 'none',
    background: '#0b0f19',
    color: '#F9FAFB',
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    boxShadow: '0 0 22px rgba(15, 23, 42, 0.9)',
    transition: 'all 0.25s ease',
  },
};
