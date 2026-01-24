import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import AdminCard from '../components/AdminCard';
import '../styles/AdminDashboard.css';

function AdminDashboard() {
  // ✅ On utilise authFetch pour bénéficier de l'auto-refresh token du contexte
  const { user, authFetch } = useContext(AuthContext);
  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('pending');

  // Effet pour vérifier les droits d'accès
  useEffect(() => {
    if (user && user.role !== 'admin') {
      setError('Vous n\'êtes pas autorisé à accéder à cette page');
      setLoading(false);
    }
  }, [user]);

  // Effet pour charger les annonces
  useEffect(() => {
    // Si l'utilisateur n'est pas admin, on ne tente même pas l'appel
    if (!user || user.role !== 'admin') {
      return;
    }

    const fetchAnnonces = async () => {
      try {
        setLoading(true);
        let url = 'http://localhost:3000/api/admin/annonces';

        if (filter !== 'all') {
          url = `http://localhost:3000/api/admin/annonces/${filter}`;
        }

        // ✅ Utilisation de authFetch (plus besoin de headers manuels ni d'axios)
        const response = await authFetch(url);
        
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des données');
        }

        const data = await response.json();
        // Ton backend renvoie directement le tableau ou un objet avec une clé annonces
        setAnnonces(Array.isArray(data) ? data : (data.annonces || []));
        setError(null);
      } catch (err) {
        console.error('Erreur:', err);
        setError('Erreur lors du chargement des annonces');
      } finally {
        setLoading(false);
      }
    };

    fetchAnnonces();
  }, [filter, user, authFetch]);

  const handleValidate = async (id) => {
    try {
      const response = await authFetch(`http://localhost:3000/api/admin/annonces/${id}/validate`, {
        method: 'PUT'
      });

      if (!response.ok) throw new Error();

      setAnnonces(annonces.filter(a => a.id !== id));
      alert('Annonce validée ✅');
    } catch (err) {
      console.error('Erreur:', err);
      alert('Erreur lors de la validation');
    }
  };

  const handleReject = async (id, reason) => {
    try {
      const response = await authFetch(`http://localhost:3000/api/admin/annonces/${id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reason })
      });

      if (!response.ok) throw new Error();

      setAnnonces(annonces.filter(a => a.id !== id));
      alert('Annonce rejetée ❌');
    } catch (err) {
      console.error('Erreur:', err);
      alert('Erreur lors du rejet');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) {
      try {
        const response = await authFetch(`http://localhost:3000/api/admin/annonces/${id}`, {
          method: 'DELETE'
        });

        if (!response.ok) throw new Error();

        setAnnonces(annonces.filter(a => a.id !== id));
        alert('Annonce supprimée 🗑️');
      } catch (err) {
        console.error('Erreur:', err);
        alert('Erreur lors de la suppression');
      }
    }
  };

  // Affichage si non autorisé
  if (!user || user.role !== 'admin') {
    return (
      <div style={styles.errorContainer}>
        <h2 style={styles.errorTitle}>❌ Accès refusé</h2>
        <p style={styles.errorText}>Vous devez être administrateur pour accéder à cette page.</p>
      </div>
    );
  }

  if (loading) {
    return <div style={styles.loadingContainer}>⏳ Chargement des données sécurisées...</div>;
  }

  return (
    <div style={styles.adminDashboard}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>🔐 Tableau de Bord Admin</h1>
          <p style={styles.subtitle}>Gestion de la modération - {user.username}</p>
        </div>
      </div>

      <div style={styles.container}>
        {/* Filtres */}
        <div style={styles.filterContainer}>
          {['pending', 'validated', 'rejected', 'all'].map((f) => (
            <button
              key={f}
              style={{
                ...styles.filterButton,
                ...(filter === f ? styles.filterButtonActive : {})
              }}
              onClick={() => setFilter(f)}
            >
              {f === 'pending' && '⏳ En attente'}
              {f === 'validated' && '✅ Validées'}
              {f === 'rejected' && '❌ Rejetées'}
              {f === 'all' && '📋 Toutes'}
            </button>
          ))}
        </div>

        {/* Message d'erreur local */}
        {error && <div style={styles.errorMessage}>{error}</div>}

        {/* Liste des annonces */}
        {annonces.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>Aucune annonce trouvée pour ce filtre.</p>
          </div>
        ) : (
          <div style={styles.annoncesGrid}>
            {annonces.map(annonce => (
              <AdminCard
                key={annonce.id}
                annonce={annonce}
                onValidate={handleValidate}
                onReject={handleReject}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Styles identiques à ta version précédente pour garder l'esthétique
const styles = {
  adminDashboard: {
    minHeight: '100vh',
    backgroundColor: '#020617',
    color: '#E5E7EB',
  },
  header: {
    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(249, 115, 22, 0.2) 100%)',
    borderBottom: '1px solid rgba(249, 115, 22, 0.3)',
    padding: '40px 24px',
    marginBottom: '40px',
  },
  headerContent: {
    maxWidth: '1180px',
    margin: '0 auto',
  },
  title: {
    fontSize: '2.5em',
    fontWeight: 700,
    margin: '0 0 10px 0',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #f97316 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  subtitle: {
    fontSize: '1em',
    color: '#9CA3AF',
    margin: 0,
  },
  container: {
    maxWidth: '1180px',
    margin: '0 auto',
    padding: '0 24px 40px 24px',
  },
  filterContainer: {
    display: 'flex',
    gap: '12px',
    marginBottom: '32px',
    flexWrap: 'wrap',
  },
  filterButton: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: '1px solid rgba(249, 115, 22, 0.3)',
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    color: '#E5E7EB',
    fontSize: '13px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(249, 115, 22, 0.9)',
    borderColor: '#f97316',
    color: '#020617',
    boxShadow: '0 0 16px rgba(249, 115, 22, 0.6)',
  },
  errorMessage: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    color: '#FCA5A5',
    padding: '16px 20px',
    borderRadius: '8px',
    marginBottom: '24px',
    fontSize: '14px',
  },
  annoncesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
    gap: '24px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    backgroundColor: 'rgba(249, 115, 22, 0.05)',
    border: '1px dashed rgba(249, 115, 22, 0.3)',
    borderRadius: '12px',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: '1.1em',
    margin: 0,
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    fontSize: '1.2em',
    color: '#8b5cf6',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#020617',
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: '2em',
    color: '#ef4444',
    marginBottom: '10px',
  },
  errorText: {
    color: '#9CA3AF',
    fontSize: '1em',
  },
};

export default AdminDashboard;