import React, { useContext, useEffect, useState, useCallback } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

export default function Annonces() {
  const { user, authFetch, accessToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const [annonces, setAnnonces] = useState([]);
  const [myAnnonces, setMyAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ titre: '', description: '' });

  const [activeTab, setActiveTab] = useState('public');

  // ------------------------------------------------------------
  // 🔥 RÉCUPÉRATION DES ANNONCES PUBLIQUES
  // ------------------------------------------------------------
  const fetchPublicAnnonces = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/annonces`);
      if (!res.ok) throw new Error('Erreur chargement');

      const data = await res.json();
      setAnnonces(data.annonces || []);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // ------------------------------------------------------------
  // 🔥 RÉCUPÉRATION DES ANNONCES DE L’UTILISATEUR CONNECTÉ
  // ------------------------------------------------------------
  const fetchMyAnnonces = useCallback(async () => {
    if (!user || !accessToken || accessToken === 'null') return;

    try {
      const res = await authFetch(`${API_BASE_URL}/annonces/me`);
      const data = await res.json();
      setMyAnnonces(data.annonces || []);
    } catch (err) {
      console.error(err);
    }
  }, [user, accessToken, authFetch]);

  // ------------------------------------------------------------
  // 🔥 CHARGEMENT INITIAL
  // ------------------------------------------------------------
  useEffect(() => {
    setLoading(true);
    Promise.all([fetchPublicAnnonces(), fetchMyAnnonces()])
      .finally(() => setLoading(false));
  }, [fetchPublicAnnonces, fetchMyAnnonces]);

  // ------------------------------------------------------------
  // 🔥 SAUVEGARDE D’UNE ANNONCE MODIFIÉE
  // ------------------------------------------------------------
  const handleEditSave = async (annonceId) => {
    try {
      const res = await authFetch(`${API_BASE_URL}/annonces/${annonceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titre: editForm.titre,
          description: editForm.description
        })
      });

      if (!res.ok) throw new Error('Échec de la sauvegarde');

      const data = await res.json();
      const updatedAnnonce = data.annonce;

      // Mise à jour dans les deux listes
      setMyAnnonces(prev => prev.map(a => a.id === annonceId ? updatedAnnonce : a));
      setAnnonces(prev => prev.map(a => a.id === annonceId ? updatedAnnonce : a));

      setEditingId(null);
      alert('Annonce sauvegardée avec succès !');
    } catch (err) {
      alert(`Erreur : ${err.message}`);
    }
  };

  // ------------------------------------------------------------
  // 🔥 SUPPRESSION D’UNE ANNONCE
  // ------------------------------------------------------------
  const handleDelete = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette annonce ?')) return;

    try {
      const res = await authFetch(`${API_BASE_URL}/annonces/${id}`, { method: 'DELETE' });

      if (res.ok) {
        setAnnonces(prev => prev.filter(a => a.id !== id));
        setMyAnnonces(prev => prev.filter(a => a.id !== id));
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // ------------------------------------------------------------
  // 🔥 AFFICHAGE CHARGEMENT
  // ------------------------------------------------------------
  if (loading) {
    return (
      <div style={styles.page}>
        <p style={styles.centerText}>⏳ Chargement des annonces...</p>
      </div>
    );
  }

  // ------------------------------------------------------------
  // 🔥 CHOIX ENTRE ANNONCES PUBLIQUES OU MES ANNONCES
  // ------------------------------------------------------------
  const displayedAnnonces = activeTab === 'public' ? annonces : myAnnonces;

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* ------------------------------------------------------------
            🔥 HEADER + BOUTON CRÉER UNE ANNONCE
        ------------------------------------------------------------ */}
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <h1 style={styles.title}>
              {activeTab === 'public' ? 'Annonces disponibles' : 'Mes Annonces'}
            </h1>
            <p style={styles.subtitle}>Suivez le statut de vos propositions de troc</p>
          </div>

          {user && (
            <button onClick={() => navigate('/create-annonce')} style={styles.createButton}>
              + CRÉER UNE ANNONCE
            </button>
          )}
        </div>

        {/* ------------------------------------------------------------
            🔥 ONGLET PUBLIC / MES ANNONCES
        ------------------------------------------------------------ */}
        {user && (
          <div style={styles.tabs}>
            <button
              style={{ ...styles.tabButton, ...(activeTab === 'public' ? styles.tabButtonActive : {}) }}
              onClick={() => setActiveTab('public')}
            >
              🌍 Publiques ({annonces.length})
            </button>

            <button
              style={{ ...styles.tabButton, ...(activeTab === 'myannonces' ? styles.tabButtonActive : {}) }}
              onClick={() => setActiveTab('myannonces')}
            >
              📋 Mes annonces ({myAnnonces.length})
            </button>
          </div>
        )}

        {/* ------------------------------------------------------------
            🔥 AFFICHAGE DES ANNONCES
        ------------------------------------------------------------ */}
        <div style={styles.grid}>
          {displayedAnnonces.map(a => (
            <div key={a.id} style={styles.card}>

              {/* ------------------------------------------------------------
                  🔥 MODE ÉDITION
              ------------------------------------------------------------ */}
              {editingId === a.id ? (
                <div style={styles.editForm}>
                  <input
                    style={styles.input}
                    value={editForm.titre}
                    onChange={e => setEditForm({ ...editForm, titre: e.target.value })}
                  />

                  <textarea
                    style={styles.textarea}
                    value={editForm.description}
                    onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  />

                  <div style={styles.editActions}>
                    <button onClick={() => handleEditSave(a.id)} style={styles.saveBtn}>Sauvegarder</button>
                    <button onClick={() => setEditingId(null)} style={styles.cancelBtn}>Annuler</button>
                  </div>
                </div>
              ) : (

                /* ------------------------------------------------------------
                    🔥 MODE AFFICHAGE NORMAL
                ------------------------------------------------------------ */
                <div style={styles.cardInner}>

                  {/* ------------------------------------------------------------
                      🔥 IMAGE CLOUDINARY
                      IMPORTANT :
                      - Tu n'as PLUS besoin de reconstruire une URL Supabase
                      - L’URL Cloudinary est déjà complète
                  ------------------------------------------------------------ */}
                  {a.image && (
                    <div style={styles.imageWrapper}>
                      <img src={a.image} alt={a.titre} style={styles.image} />
                    </div>
                  )}

                  <div style={styles.cardContent}>
                    <h3 style={styles.cardTitle}>{a.titre}</h3>
                    <p style={styles.cardDescription}>{a.description}</p>

                    <div style={styles.cardMeta}>
                      <span>👤 {a.username}</span>
                      <span>🕐 {new Date(a.created_at || a.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>

                    {/* ------------------------------------------------------------
                        🔥 BADGE STATUT (MES ANNONCES)
                    ------------------------------------------------------------ */}
                    {activeTab === 'myannonces' && (
                      <div style={{
                        ...styles.statusBadge,
                        background: a.status === 'pending'
                          ? 'rgba(249,115,22,0.2)'
                          : 'rgba(34,197,94,0.2)',
                        color: a.status === 'pending' ? '#fbbf24' : '#4ade80'
                      }}>
                        {a.status === 'pending' ? 'EN ATTENTE' : 'VALIDÉ'}
                      </div>
                    )}

                    {/* ------------------------------------------------------------
                        🔥 BOUTONS MODIFIER / SUPPRIMER
                        (Seulement pour le propriétaire)
                    ------------------------------------------------------------ */}
                    {user && (user.id === a.user_id || user.id === a.userId) && (
                      <div style={styles.actions}>
                        <button
                          onClick={() => {
                            setEditingId(a.id);
                            setEditForm({ titre: a.titre, description: a.description });
                          }}
                          style={styles.editBtn}
                        >
                          ✏️ Modifier
                        </button>

                        <button
                          onClick={() => handleDelete(a.id)}
                          style={styles.deleteBtn}
                        >
                          🗑️ Supprimer
                        </button>
                      </div>
                    )}

                  </div>
                </div>
              )}

            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

// ------------------------------------------------------------
// 🔥 STYLES (inchangés)
// ------------------------------------------------------------
const styles = {
  page: { minHeight: '100vh', background: 'radial-gradient(circle at 0% 0%, #1f2937 0, transparent 50%), radial-gradient(circle at 100% 100%, #7f1d1d 0, transparent 50%), linear-gradient(135deg, #020617, #020617)', color: '#F9FAFB', padding: '60px 20px' },
  container: { maxWidth: '1280px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: 40, alignItems: 'center' },
  title: { fontSize: 40, fontWeight: 700, margin: 0 },
  subtitle: { color: '#9CA3AF', margin: '8px 0 0 0' },
  createButton: { padding: '14px 32px', borderRadius: 999, border: 'none', background: 'radial-gradient(circle at 0 0, rgba(249,115,22,0.4), rgba(249,115,22,0.95))', color: '#020617', fontSize: 14, fontWeight: 700, letterSpacing: '0.14em', cursor: 'pointer', boxShadow: '0 0 28px rgba(249,115,22,0.6)', textTransform: 'uppercase' },
  tabs: { display: 'flex', gap: 20, marginBottom: 40, borderBottom: '1px solid rgba(249,115,22,0.2)' },
  tabButton: { padding: '12px 0', background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontWeight: 600 },
  tabButtonActive: { color: '#f97316', borderBottom: '2px solid #f97316' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 28 },
  card: { background: 'rgba(31, 41, 55, 0.8)', borderRadius: 20, border: '1px solid rgba(148,163,184,0.2)', overflow: 'hidden' },
  imageWrapper: { height: 220 },
  image: { width: '100%', height: '100%', objectFit: 'cover' },
  cardContent: { padding: 24 },
  cardTitle: { margin: '0 0 10px 0', fontSize: 18 },
  cardDescription: { color: '#D1D5DB', fontSize: 14, lineHeight: 1.6 },
  cardMeta: { display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#9CA3AF', marginTop: 15, paddingTop: 15, borderTop: '1px solid rgba(148,163,184,0.1)' },
  statusBadge: { marginTop: 15, padding: '8px', borderRadius: 8, textAlign: 'center', fontSize: 12, fontWeight: 700 },
  actions: { display: 'flex', gap: 10, marginTop: 20 },
  editBtn: { flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: 'rgba(59,130,246,0.3)', color: '#BFDBFE', cursor: 'pointer' },
  deleteBtn: { padding: '10px 15px', borderRadius: 10, border: 'none', background: 'rgba(239,68,68,0.3)', color: '#FECACA', cursor: 'pointer' },
  editForm: { padding: 24, display: 'flex', flexDirection: 'column', gap: 15 },
  input: { padding: 12, borderRadius: 10, border: '1px solid #334155', background: '#0f172a', color: 'white' },
  textarea: { padding: 12, borderRadius: 10, border: '1px solid #334155', background: '#0f172a', color: 'white', height: 100 },
  editActions: { display: 'flex', gap: 10 },
  saveBtn: { flex: 1, background: '#22c55e', color: 'white', border: 'none', padding: 12, borderRadius: 10, cursor: 'pointer', fontWeight: 700 },
  cancelBtn: { flex: 1, background: '#64748b', color: 'white', border: 'none', padding: 12, borderRadius: 10, cursor: 'pointer' },
  centerText: { textAlign: 'center', padding: 100, color: '#9CA3AF' }
};
