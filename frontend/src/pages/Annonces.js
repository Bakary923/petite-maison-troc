import React, { useContext, useEffect, useState, useCallback } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Annonces() {
  const { user, authFetch } = useContext(AuthContext);
  const navigate = useNavigate();
  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ titre: '', description: '' });

  const fetchAnnonces = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/annonces');
      if (!res.ok) throw new Error('Erreur lors du chargement');
      const data = await res.json();
      setAnnonces(data.annonces || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnonces();
  }, [fetchAnnonces]);

  const handleDelete = async (annonceId) => {
    if (!user) {
      alert('Tu dois être connecté pour supprimer une annonce');
      return;
    }
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) {
      return;
    }
    try {
      const res = await authFetch(`http://localhost:3000/api/annonces/${annonceId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Erreur suppression');
      setAnnonces(prev => prev.filter(a => a.id !== annonceId));
    } catch (err) {
      alert(`Erreur : ${err.message}`);
    }
  };

  const handleEditStart = (annonce) => {
    if (!user) {
      alert('Tu dois être connecté pour modifier une annonce');
      return;
    }
    setEditingId(annonce.id);
    setEditForm({ titre: annonce.titre, description: annonce.description });
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditForm({ titre: '', description: '' });
  };

  const handleEditSave = async (annonceId) => {
    try {
      const formData = new FormData();
      formData.append('titre', editForm.titre);
      formData.append('description', editForm.description);

      const res = await authFetch(`http://localhost:3000/api/annonces/${annonceId}`, {
        method: 'PUT',
        body: formData
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg =
          body.error ||
          body.message ||
          (body.errors && body.errors[0]?.msg) ||
          `HTTP ${res.status}`;
        throw new Error(msg);
      }

      const data = await res.json();
      setAnnonces(prev => prev.map(a => a.id === annonceId ? data.annonce : a));
      setEditingId(null);
      setEditForm({ titre: '', description: '' });
      alert('Annonce modifiée avec succès !');
    } catch (err) {
      alert(`Erreur : ${err.message}`);
    }
  };

  if (loading) return <div style={styles.container}><p style={styles.centerText}>⏳ Chargement...</p></div>;
  if (error) return <div style={styles.container}><p style={{...styles.centerText, color: '#ef4444'}}>❌ Erreur : {error}</p></div>;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* HEADER */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Annonces disponibles</h1>
            <p style={styles.subtitle}>Explorez les objets à échanger ou donner</p>
          </div>

          {user ? (
            <button
              onClick={() => navigate('/create-annonce')}
              style={styles.createButton}
              onMouseEnter={(e) => {
                e.target.style.background = 'radial-gradient(circle at 0 0, rgba(249,115,22,0.5), rgba(249,115,22,1))';
                e.target.style.boxShadow = '0 0 32px rgba(249,115,22,0.8)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'radial-gradient(circle at 0 0, rgba(249,115,22,0.4), rgba(249,115,22,0.95))';
                e.target.style.boxShadow = '0 0 28px rgba(249,115,22,0.6)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              Créer une annonce
            </button>
          ) : (
            <p style={styles.loginPrompt}>
              <a onClick={() => navigate('/login')} style={styles.link}>Connecte-toi</a> ou{' '}
              <a onClick={() => navigate('/signup')} style={styles.link}>inscris-toi</a> pour créer une annonce
            </p>
          )}
        </div>

        {/* GRID D'ANNONCES */}
        {annonces.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>Aucune annonce pour le moment</p>
            <p style={styles.emptySubtext}>Soyez le premier à proposer quelque chose !</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {annonces.map(a => (
              <div key={a.id} style={styles.card}>
                {editingId === a.id ? (
                  // MODE ÉDITION
                  <div style={styles.editForm}>
                    <input
                      type="text"
                      value={editForm.titre}
                      onChange={(e) => setEditForm({...editForm, titre: e.target.value})}
                      placeholder="Titre"
                      style={styles.input}
                    />
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                      placeholder="Description"
                      style={styles.textarea}
                    />
                    <div style={styles.editActions}>
                      <button
                        onClick={() => handleEditSave(a.id)}
                        style={{...styles.button, background: 'rgba(34,197,94,0.3)', borderColor: 'rgba(34,197,94,0.7)', color: '#bbf7d0'}}
                      >
                        Enregistrer
                      </button>
                      <button
                        onClick={handleEditCancel}
                        style={{...styles.button, background: 'rgba(107,114,128,0.3)', borderColor: 'rgba(107,114,128,0.7)', color: '#d1d5db'}}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  // MODE AFFICHAGE
                  <div>
                    {a.image && (
                      <img src={a.image} alt={a.titre} style={styles.image} />
                    )}
                    
                    <div style={styles.cardContent}>
                      <h3 style={styles.cardTitle}>{a.titre}</h3>
                      <p style={styles.cardDescription}>{a.description}</p>

                      <div style={styles.cardMeta}>
                        <span style={styles.author}>Par <strong>{a.username}</strong></span>
                        {a.createdAt && (
                          <span style={styles.date}>
                            {new Date(a.createdAt).toLocaleString('fr-FR', {
                              dateStyle: 'short',
                              timeStyle: 'short'
                            })}
                            {a.updatedAt && new Date(a.updatedAt).getTime() > new Date(a.createdAt).getTime() && (
                              <span style={styles.modified}>
                                (modifié)
                              </span>
                            )}
                          </span>
                        )}
                      </div>

                      {user && a.username === user.username && (
                        <div style={styles.actions}>
                          <button
                            onClick={() => handleEditStart(a)}
                            style={{...styles.button, background: 'rgba(59,130,246,0.3)', borderColor: 'rgba(59,130,246,0.7)', color: '#bfdbfe'}}
                            onMouseEnter={(e) => {
                              e.target.style.background = 'rgba(59,130,246,0.5)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = 'rgba(59,130,246,0.3)';
                            }}
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDelete(a.id)}
                            style={{...styles.button, background: 'rgba(239,68,68,0.3)', borderColor: 'rgba(239,68,68,0.7)', color: '#fecaca'}}
                            onMouseEnter={(e) => {
                              e.target.style.background = 'rgba(239,68,68,0.5)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background = 'rgba(239,68,68,0.3)';
                            }}
                          >
                            Supprimer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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
    padding: '40px 20px',
  },
  container: {
    maxWidth: '1180px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 40,
    marginBottom: 60,
  },
  title: {
    fontSize: 36,
    fontWeight: 700,
    margin: '0 0 12px 0',
    color: '#F9FAFB',
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    margin: 0,
    fontWeight: 400,
  },
  createButton: {
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
    whiteSpace: 'nowrap',
  },
  loginPrompt: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  link: {
    color: '#f97316',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontWeight: 600,
  },
  emptyState: {
    textAlign: 'center',
    padding: '80px 20px',
    borderRadius: 20,
    border: '1px solid rgba(31, 41, 55, 0.9)',
    background: 'rgba(15, 23, 42, 0.96)',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 600,
    margin: '0 0 8px 0',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    margin: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 24,
  },
  card: {
    borderRadius: 20,
    border: '1px solid rgba(31, 41, 55, 0.9)',
    background: 'rgba(15, 23, 42, 0.96)',
    overflow: 'hidden',
    boxShadow: '0 18px 40px rgba(0, 0, 0, 0.7)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  },
  cardContent: {
    padding: 20,
  },
  image: {
    width: '100%',
    height: 200,
    objectFit: 'cover',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 600,
    margin: '0 0 8px 0',
    color: '#F9FAFB',
  },
  cardDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    margin: '0 0 16px 0',
    lineHeight: 1.5,
  },
  cardMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    marginBottom: 16,
    paddingBottom: 16,
    borderBottom: '1px solid rgba(31, 41, 55, 0.9)',
  },
  author: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  date: {
    fontSize: 12,
    color: '#6B7280',
  },
  modified: {
    color: '#f97316',
    fontStyle: 'italic',
    marginLeft: 8,
  },
  actions: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
  },
  button: {
    padding: '8px 14px',
    borderRadius: 8,
    border: '1px solid',
    background: 'transparent',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  editForm: {
    padding: 20,
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    marginBottom: 12,
    borderRadius: 8,
    border: '1px solid rgba(31, 41, 55, 0.9)',
    background: 'rgba(15, 23, 42, 0.8)',
    color: '#F9FAFB',
    fontSize: 14,
    fontFamily: 'inherit',
  },
  textarea: {
    width: '100%',
    height: 100,
    padding: '10px 12px',
    marginBottom: 12,
    borderRadius: 8,
    border: '1px solid rgba(31, 41, 55, 0.9)',
    background: 'rgba(15, 23, 42, 0.8)',
    color: '#F9FAFB',
    fontSize: 14,
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  editActions: {
    display: 'flex',
    gap: 10,
  },
  centerText: {
    textAlign: 'center',
    padding: '40px 20px',
  },
};
