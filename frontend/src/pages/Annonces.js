import React, { useContext, useEffect, useState, useCallback } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Annonces() {
  const { user, authFetch } = useContext(AuthContext);
  const navigate = useNavigate();
  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // États pour l'édition
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ titre: '', description: '' });

  // Fonction pour récupérer les annonces (PUBLIQUE = pas besoin de JWT)
  const fetchAnnonces = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/annonces');
      if (!res.ok) throw new Error('Erreur lors du chargement');
      const data = await res.json();
      console.log(data.annonces);
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

  // Suppression d'annonce (nécessite d'être connecté = utilise authFetch)
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

  // Édition - commencer
  const handleEditStart = (annonce) => {
    if (!user) {
      alert('Tu dois être connecté pour modifier une annonce');
      return;
    }
    setEditingId(annonce.id);
    setEditForm({ titre: annonce.titre, description: annonce.description });
  };

  // Édition - annuler
  const handleEditCancel = () => {
    setEditingId(null);
    setEditForm({ titre: '', description: '' });
  };

  // ✅ ÉDITION - SAUVEGARDER (CORRIGÉ)
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
          (body.errors && body.errors[0]?.msg) ||   // 1er message express-validator
          `HTTP ${res.status}`;
        throw new Error(msg);
      }

      const data = await res.json();
      setAnnonces(prev => prev.map(a => a.id === annonceId ? data.annonce : a));
      setEditingId(null);
      setEditForm({ titre: '', description: '' });
      alert('Annonce modifiée avec succès !');
    } catch (err) {
      console.error('[ERROR EDIT]', err);
      alert(`Erreur : ${err.message}`);  // affichera le vrai texte au lieu de HTTP 400
    }
  };


  if (loading) return <p style={styles.center}>⏳ Chargement...</p>;
  if (error) return <p style={{...styles.center, color: 'red'}}>❌ Erreur : {error}</p>;

  return (
    <div style={styles.container}>
      <h1>📋 Annonces disponibles</h1>

      {/* Bouton créer annonce (visible que si connecté) */}
      {user ? (
        <button 
          onClick={() => navigate('/create-annonce')}
          style={styles.createButton}
        >
          ➕ Créer une annonce
        </button>
      ) : (
        <p style={styles.loginPrompt}>
          <a onClick={() => navigate('/login')} style={styles.link}>Connecte-toi</a> ou 
          <a onClick={() => navigate('/signup')} style={styles.link}> inscris-toi</a> pour créer une annonce
        </p>
      )}

      {/* Liste des annonces */}
      {annonces.length === 0 ? (
        <p style={styles.center}>Aucune annonce pour le moment</p>
      ) : (
        <ul style={styles.grid}>
          {annonces.map(a => (
            <li key={a.id} style={styles.card}>
              {editingId === a.id ? (
                // MODE ÉDITION
                <div>
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
                  <div>
                    <button 
                      onClick={() => handleEditSave(a.id)}
                      style={{...styles.button, backgroundColor: '#4CAF50'}}
                    >
                      ✅ Enregistrer
                    </button>
                    <button 
                      onClick={handleEditCancel}
                      style={{...styles.button, backgroundColor: '#999'}}
                    >
                      ❌ Annuler
                    </button>
                  </div>
                </div>
              ) : (
                // MODE AFFICHAGE
                <div>
                  {a.image && <img src={a.image} alt={a.titre} style={styles.image} />}
                  <h3>{a.titre}</h3>
                  <p>{a.description}</p>
                  {/* ✅ AFFICHAGE DATE ET HEURE CORRIGÉ */}
                  <small>
                    Par <strong>{a.username}</strong> • 
                    {a.createdAt && (
                      <span style={{ marginLeft: 8, color: '#666' }}>
                        {/* Affiche la date formatée avec HEURE */}
                        {new Date(a.createdAt).toLocaleString('fr-FR', { 
                          dateStyle: 'short', 
                          timeStyle: 'short' 
                        })}
                        {/* Affiche "(modifié)" si l'annonce a été modifiée */}
                        {a.updatedAt && new Date(a.updatedAt).getTime() > new Date(a.createdAt).getTime() && (
                          <span style={{ fontStyle: 'italic', marginLeft: 8, color: '#ff9800' }}>
                            (modifié le {new Date(a.updatedAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })})
                          </span>
                        )}
                      </span>
                    )}
                  </small>
                  
                  {/* Boutons modifier/supprimer visible que si c'est TON annonce ET tu es connecté */}
                  {user && a.username === user.username && (
                    <div style={styles.actions}>
                      <button 
                        onClick={() => handleEditStart(a)}
                        style={{...styles.button, backgroundColor: '#0066cc'}}
                      >
                        ✏️ Modifier
                      </button>
                      <button 
                        onClick={() => handleDelete(a.id)}
                        style={{...styles.button, backgroundColor: '#ff4444'}}
                      >
                        🗑️ Supprimer
                      </button>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '40px auto',
    padding: '0 20px'
  },
  createButton: {
    padding: '10px 20px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginBottom: '30px',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  loginPrompt: {
    backgroundColor: '#e3f2fd',
    padding: '15px',
    borderRadius: '5px',
    marginBottom: '30px',
    textAlign: 'center'
  },
  link: {
    color: '#0066cc',
    cursor: 'pointer',
    textDecoration: 'underline',
    margin: '0 5px'
  },
  grid: {
    listStyle: 'none',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
    padding: 0
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '15px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    listStyle: 'none'
  },
  image: {
    width: '200px',
    height: '200px',
    border: '3px solid red',
    objectFit: 'cover',
    borderRadius: '5px',
    marginBottom: '10px'
  },
  actions: {
    marginTop: '15px',
    display: 'flex',
    gap: '10px'
  },
  button: {
    padding: '8px 12px',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  input: {
    width: '100%',
    padding: '8px',
    marginBottom: '8px',
    borderRadius: '4px',
    border: '1px solid #ccc'
  },
  textarea: {
    width: '100%',
    height: '80px',
    padding: '8px',
    marginBottom: '8px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontFamily: 'inherit'
  },
  center: {
    textAlign: 'center',
    padding: '40px'
  }
};
