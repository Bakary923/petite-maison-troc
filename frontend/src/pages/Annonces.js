import React, { useContext, useEffect, useState, useCallback } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';


export default function Annonces() {
  const { user, authFetch } = useContext(AuthContext);
  const navigate = useNavigate();
  const [annonces, setAnnonces] = useState([]);
  const [myAnnonces, setMyAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ titre: '', description: '' });
  const [activeTab, setActiveTab] = useState('public'); // 'public' ou 'myannonces'


  // Récupérer les annonces VALIDÉES (publiques)
  const fetchPublicAnnonces = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:3000/api/annonces');
      if (!res.ok) throw new Error('Erreur lors du chargement');
      const data = await res.json();
      setAnnonces(data.annonces || []);
    } catch (err) {
      setError(err.message);
    }
  }, []);


  // Récupérer MES annonces (pending + validated + rejected)
  const fetchMyAnnonces = useCallback(async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/api/annonces/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Erreur lors du chargement');
      const data = await res.json();
      setMyAnnonces(data.annonces || []);
    } catch (err) {
      console.error('Erreur fetch mes annonces:', err);
    }
  }, [user]);


  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchPublicAnnonces(),
      user ? fetchMyAnnonces() : Promise.resolve()
    ]).finally(() => setLoading(false));
  }, [fetchPublicAnnonces, fetchMyAnnonces, user]);


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
      setMyAnnonces(prev => prev.filter(a => a.id !== annonceId));
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
      setMyAnnonces(prev => prev.map(a => a.id === annonceId ? data.annonce : a));
      setAnnonces(prev => prev.map(a => a.id === annonceId ? data.annonce : a));
      setEditingId(null);
      setEditForm({ titre: '', description: '' });
      alert('Annonce modifiée avec succès !');
    } catch (err) {
      alert(`Erreur : ${err.message}`);
    }
  };


  if (loading) return (
    <div style={styles.page}>
      <div style={styles.container}>
        <p style={styles.centerText}>⏳ Chargement...</p>
      </div>
    </div>
  );


  if (error) return (
    <div style={styles.page}>
      <div style={styles.container}>
        <p style={{...styles.centerText, color: '#ef4444'}}>❌ Erreur : {error}</p>
      </div>
    </div>
  );


  // Afficher les annonces publiques OU mes annonces selon l'onglet
  const displayedAnnonces = activeTab === 'public' ? annonces : myAnnonces;
  const isPublicTab = activeTab === 'public';


  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* HEADER */}
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <h1 style={styles.title}>
              {isPublicTab ? 'Annonces disponibles' : 'Mes Annonces'}
            </h1>
            <p style={styles.subtitle}>
              {isPublicTab 
                ? 'Explorez les objets à échanger ou donner' 
                : 'Gérez vos annonces et suivez leur statut'}
            </p>
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
              + Créer une annonce
            </button>
          ) : (
            <p style={styles.loginPrompt}>
              <a onClick={() => navigate('/connexion')} style={styles.link}>Connecte-toi</a> ou{' '}
              <a onClick={() => navigate('/inscription')} style={styles.link}>inscris-toi</a> pour créer
            </p>
          )}
        </div>

        {/* TABS (seulement si connecté) */}
        {user && (
          <div style={styles.tabs}>
            <button
              style={{
                ...styles.tabButton,
                ...(activeTab === 'public' ? styles.tabButtonActive : {})
              }}
              onClick={() => setActiveTab('public')}
            >
              🌍 Annonces publiques ({annonces.length})
            </button>
            <button
              style={{
                ...styles.tabButton,
                ...(activeTab === 'myannonces' ? styles.tabButtonActive : {})
              }}
              onClick={() => setActiveTab('myannonces')}
            >
              📋 Mes annonces ({myAnnonces.length})
            </button>
          </div>
        )}

        {/* GRID D'ANNONCES */}
        {displayedAnnonces.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>
              {isPublicTab 
                ? '✨ Aucune annonce pour le moment' 
                : '📭 Tu n\'as pas encore créé d\'annonce'}
            </p>
            <p style={styles.emptySubtext}>
              {isPublicTab 
                ? 'Soyez le premier à proposer quelque chose !' 
                : 'Crée ta première annonce en cliquant sur le bouton ci-dessus'}
            </p>
          </div>
        ) : (
          <div style={styles.grid}>
            {displayedAnnonces.map(a => (
              <div key={a.id} style={styles.card}>
                {editingId === a.id ? (
                  // MODE ÉDITION
                  <div style={styles.editForm}>
                    <h3 style={styles.editTitle}>Modifier l'annonce</h3>
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
                        style={styles.saveBtn}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(34,197,94,0.5)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'rgba(34,197,94,0.3)';
                        }}
                      >
                        ✓ Enregistrer
                      </button>
                      <button
                        onClick={handleEditCancel}
                        style={styles.cancelBtn}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(107,114,128,0.5)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'rgba(107,114,128,0.3)';
                        }}
                      >
                        ✕ Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  // MODE AFFICHAGE
                  <div style={styles.cardInner}>
                    {a.image && (
                      <div style={styles.imageWrapper}>
                        <img src={a.image} alt={a.titre} style={styles.image} />
                      </div>
                    )}
                    
                    <div style={styles.cardContent}>
                      <h3 style={styles.cardTitle}>{a.titre}</h3>
                      <p style={styles.cardDescription}>{a.description}</p>

                      <div style={styles.cardMeta}>
                        <span style={styles.author}>👤 <strong>{a.username}</strong></span>
                        {a.createdAt && (
                          <span style={styles.date}>
                            🕐 {new Date(a.createdAt).toLocaleString('fr-FR', {
                              dateStyle: 'short',
                              timeStyle: 'short'
                            })}
                            {a.updatedAt && new Date(a.updatedAt).getTime() > new Date(a.createdAt).getTime() && (
                              <span style={styles.modified}> (modifié)</span>
                            )}
                          </span>
                        )}
                      </div>

                      {/* STATUS BADGE (pour les onglets "Mes annonces") */}
                      {!isPublicTab && a.status && (
                        <div style={{
                          ...styles.statusBadge,
                          ...(a.status === 'pending' ? styles.statusPending : {}),
                          ...(a.status === 'validated' ? styles.statusValidated : {}),
                          ...(a.status === 'rejected' ? styles.statusRejected : {})
                        }}>
                          {a.status === 'pending' && '⏳ En attente de validation'}
                          {a.status === 'validated' && '✅ Validée'}
                          {a.status === 'rejected' && '❌ Rejetée'}
                        </div>
                      )}

                      {/* REJECTION REASON */}
                      {!isPublicTab && a.status === 'rejected' && a.rejectionReason && (
                        <div style={styles.rejectionReason}>
                          <strong>Raison :</strong> {a.rejectionReason}
                        </div>
                      )}

                      {/* ACTIONS */}
                      {!isPublicTab && user && (
                        <div style={styles.actions}>
                          {a.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleEditStart(a)}
                                style={styles.editBtn}
                                onMouseEnter={(e) => {
                                  e.target.style.background = 'rgba(59,130,246,0.5)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = 'rgba(59,130,246,0.3)';
                                }}
                              >
                                ✏️ Modifier
                              </button>
                              <button
                                onClick={() => handleDelete(a.id)}
                                style={styles.deleteBtn}
                                onMouseEnter={(e) => {
                                  e.target.style.background = 'rgba(239,68,68,0.5)';
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = 'rgba(239,68,68,0.3)';
                                }}
                              >
                                🗑️ Supprimer
                              </button>
                            </>
                          )}
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
    padding: '60px 20px 40px',
  },
  container: {
    maxWidth: '1280px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 40,
    marginBottom: 40,
    flexWrap: 'wrap',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 40,
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
  // ✨ TABS
  tabs: {
    display: 'flex',
    gap: '12px',
    marginBottom: '40px',
    borderBottom: '1px solid rgba(249, 115, 22, 0.2)',
  },
  tabButton: {
    padding: '12px 20px',
    border: 'none',
    background: 'transparent',
    color: '#9CA3AF',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    transition: 'all 0.3s',
  },
  tabButtonActive: {
    color: '#f97316',
    borderBottomColor: '#f97316',
  },
  emptyState: {
    textAlign: 'center',
    padding: '100px 20px',
    borderRadius: 20,
    border: '1px solid rgba(148, 163, 184, 0.2)',
    background: 'rgba(15, 23, 42, 0.5)',
  },
  emptyText: {
    fontSize: 24,
    fontWeight: 600,
    margin: '0 0 8px 0',
    color: '#F9FAFB',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#9CA3AF',
    margin: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
    gap: 28,
  },
  card: {
    borderRadius: 20,
    border: '1px solid rgba(148, 163, 184, 0.2)',
    background: 'rgba(31, 41, 55, 0.8)',
    overflow: 'hidden',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  },
  cardInner: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  imageWrapper: {
    width: '100%',
    height: 220,
    overflow: 'hidden',
    background: 'linear-gradient(135deg, rgba(249,115,22,0.1), rgba(59,130,246,0.1))',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  cardContent: {
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 700,
    margin: 0,
    color: '#F9FAFB',
  },
  cardDescription: {
    fontSize: 14,
    color: '#D1D5DB',
    margin: 0,
    lineHeight: 1.6,
    flex: 1,
  },
  cardMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTop: '1px solid rgba(148, 163, 184, 0.2)',
  },
  author: {
    fontSize: 13,
    color: '#BCD5E9',
    fontWeight: 500,
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  modified: {
    color: '#f97316',
    fontStyle: 'italic',
    marginLeft: 8,
  },
  // ✨ STATUS
  statusBadge: {
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '0.9em',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: '8px',
  },
  statusPending: {
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
    color: '#fbbf24',
    border: '1px solid rgba(249, 115, 22, 0.4)',
  },
  statusValidated: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    color: '#86efac',
    border: '1px solid rgba(34, 197, 94, 0.4)',
  },
  statusRejected: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    color: '#fca5a5',
    border: '1px solid rgba(239, 68, 68, 0.4)',
  },
  rejectionReason: {
    padding: '12px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '6px',
    color: '#fca5a5',
    fontSize: '0.9em',
    marginBottom: '15px',
  },
  actions: {
    display: 'flex',
    gap: 10,
    marginTop: 16,
  },
  editBtn: {
    flex: 1,
    padding: '10px 16px',
    borderRadius: 10,
    border: 'none',
    background: 'rgba(59,130,246,0.3)',
    color: '#BFDBFE',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  deleteBtn: {
    flex: 1,
    padding: '10px 16px',
    borderRadius: 10,
    border: 'none',
    background: 'rgba(239,68,68,0.3)',
    color: '#FECACA',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  editForm: {
    padding: 28,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  editTitle: {
    fontSize: 18,
    fontWeight: 700,
    margin: '0 0 8px 0',
    color: '#F9FAFB',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 12,
    border: '1px solid rgba(148, 163, 184, 0.3)',
    background: 'rgba(15, 23, 42, 0.8)',
    color: '#F9FAFB',
    fontSize: 14,
    fontFamily: 'inherit',
    transition: 'all 0.2s ease',
  },
  textarea: {
    width: '100%',
    height: 120,
    padding: '12px 16px',
    borderRadius: 12,
    border: '1px solid rgba(148, 163, 184, 0.3)',
    background: 'rgba(15, 23, 42, 0.8)',
    color: '#F9FAFB',
    fontSize: 14,
    fontFamily: 'inherit',
    resize: 'vertical',
    transition: 'all 0.2s ease',
  },
  editActions: {
    display: 'flex',
    gap: 12,
    marginTop: 8,
  },
  saveBtn: {
    flex: 1,
    padding: '10px 16px',
    borderRadius: 10,
    border: 'none',
    background: 'rgba(34,197,94,0.3)',
    color: '#BBEF5D0',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  cancelBtn: {
    flex: 1,
    padding: '10px 16px',
    borderRadius: 10,
    border: 'none',
    background: 'rgba(107,114,128,0.3)',
    color: '#D1D5DB',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  centerText: {
    textAlign: 'center',
    padding: '80px 20px',
    fontSize: 18,
    color: '#9CA3AF',
  },
};
