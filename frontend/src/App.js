import React, { useContext, useEffect, useState, useCallback } from 'react';
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import Login from './login';
import CreateAnnonce from './CreateAnnonce';

// Composant principal de l'application
function AppInner() {
  // Récupère l'utilisateur connecté, la fonction logout et authFetch du contexte d'authentification
  const { user, logout, authFetch } = useContext(AuthContext);
  
  // État pour stocker la liste des annonces
  const [annonces, setAnnonces] = useState([]);
  
  // État pour gérer le chargement
  const [loading, setLoading] = useState(true);
  
  // État pour afficher les erreurs potentielles
  const [error, setError] = useState(null);
  
  // État pour afficher/masquer le formulaire de création d'annonce
  const [showCreate, setShowCreate] = useState(false);

  // États pour gérer l'édition d'une annonce
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ titre: '', description: '' });

  // Fonction asynchrone pour récupérer toutes les annonces du backend
  const fetchAnnonces = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch('http://localhost:3000/api/annonces');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAnnonces(data.annonces || []);
    } catch (err) {
      setError(err.message || 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  // Récupère les annonces au montage du composant
  useEffect(() => {
    fetchAnnonces();
  }, [fetchAnnonces]);

  // Fonction appelée quand une nouvelle annonce est créée
  const handleCreate = async (newAnnonce) => {
    if (newAnnonce) {
      const a = newAnnonce.annonce || newAnnonce;
      setAnnonces(prev => {
        const exists = a && (prev.some(p => (p.id && a.id && p.id === a.id) || (p._id && a._id && p._id === a._id)));
        if (exists) return prev;
        return a ? [a, ...prev] : prev;
      });
      return;
    }
    await fetchAnnonces();
  };

  // Fonction pour supprimer une annonce
  const handleDelete = async (annonceId) => {
    // Demande une confirmation avant de supprimer
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) {
      return;
    }

    try {
      // Appel API DELETE pour supprimer l'annonce
      const res = await authFetch(`http://localhost:3000/api/annonces/${annonceId}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      // Supprime l'annonce de la liste locale
      setAnnonces(prev => prev.filter(a => a.id !== annonceId));
    } catch (err) {
      alert(`Erreur : ${err.message}`);
    }
  };

  // Fonction pour commencer à modifier une annonce
  const handleEditStart = (annonce) => {
    setEditingId(annonce.id);
    setEditForm({
      titre: annonce.titre,
      description: annonce.description
    });
  };

  // Fonction pour annuler la modification
  const handleEditCancel = () => {
    setEditingId(null);
    setEditForm({ titre: '', description: '' });
  };

  // Fonction pour sauvegarder les modifications
  const handleEditSave = async (annonceId) => {
    try {
      // Crée un FormData pour envoyer titre + description
      const formData = new FormData();
      formData.append('titre', editForm.titre);
      formData.append('description', editForm.description);

      // Appel API PUT avec authFetch
      const res = await authFetch(`http://localhost:3000/api/annonces/${annonceId}`, {
        method: 'PUT',
        body: formData
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      // Récupère l'annonce modifiée
      const data = await res.json();
      const updated = data.annonce;

      // Met à jour la liste des annonces
      setAnnonces(prev => prev.map(a => a.id === annonceId ? updated : a));

      // Arrête l'édition
      setEditingId(null);
      setEditForm({ titre: '', description: '' });
    } catch (err) {
      alert(`Erreur : ${err.message}`);
    }
  };

  // Si l'utilisateur n'est pas connecté, affiche la page de login
  if (!user) return <Login />;

  return (
    <div className="App" style={{ padding: 20 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Annonces - Espace Troc</h1>
        <div>
          <span style={{ marginRight: 12 }}>Bonjour, {user.username}</span>
          <button onClick={logout}>Se déconnecter</button>
        </div>
      </header>

      <main style={{ marginTop: 18 }}>
        <div style={{ marginBottom: 16 }}>
          <button onClick={() => setShowCreate(s => !s)}>
            {showCreate ? 'Fermer' : 'Créer une annonce'}
          </button>
        </div>

        {showCreate && (
          <CreateAnnonce
            onCreate={handleCreate}
            onCancel={() => setShowCreate(false)}
          />
        )}

        {loading && <p>Chargement des annonces…</p>}
        {error && <p style={{ color: 'crimson' }}>Erreur : {error}</p>}
        
        {!loading && !error && (
          annonces.length === 0 ? 
            <p>Aucune annonce pour le moment.</p> :
            <ul style={{ marginTop: 12 }}>
              {annonces.map(a => (
                <li key={a.id || a._id || `${a.titre}-${Math.random()}`} style={{ marginBottom: 12, padding: 8, borderBottom: '1px solid #eee' }}>
                  {/* MODE ÉDITION ou MODE AFFICHAGE */}
                  {editingId === a.id ? (
                    // MODE ÉDITION
                    <div>
                      {/* Champ de saisie pour le titre */}
                      <input
                        type="text"
                        value={editForm.titre}
                        onChange={(e) => setEditForm({...editForm, titre: e.target.value})}
                        placeholder="Titre"
                        style={{ width: '100%', padding: 4, marginBottom: 4 }}
                      />
                      {/* Champ de saisie pour la description */}
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                        placeholder="Description"
                        style={{ width: '100%', height: 80, padding: 4, marginBottom: 4 }}
                      />
                      {/* Boutons Enregistrer et Annuler */}
                      <div>
                        <button 
                          onClick={() => handleEditSave(a.id)}
                          style={{ padding: '4px 8px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: 4 }}
                        >
                          Enregistrer
                        </button>
                        <button 
                          onClick={handleEditCancel}
                          style={{ padding: '4px 8px', backgroundColor: '#999', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    // MODE AFFICHAGE
                    <div>
                      {/* Titre de l'annonce */}
                      <strong>{a.titre}</strong><br />
                      
                      {/* Description de l'annonce */}
                      <div style={{ whiteSpace: 'pre-wrap' }}>{a.description}</div>
                      
                      {/* Affichage de l'image si elle existe */}
                      {a.image && (
                        <div style={{ marginTop: 8, marginBottom: 8 }}>
                          <img 
                            src={a.image} 
                            alt={a.titre} 
                            style={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain' }}
                          />
                        </div>
                      )}
                      
                      {/* Affichage de l'auteur et de la date (créée ou modifiée) */}
                      <small>
                        Par {a.username} 
                        {(a.updatedAt || a.createdAt) && (
                          <span style={{ marginLeft: 8, color: '#666' }}>
                            {/* Affiche updated_at s'il existe, sinon created_at */}
                            • {new Date(a.updatedAt || a.createdAt).toLocaleString('fr-FR', { 
                              dateStyle: 'short', 
                              timeStyle: 'short' 
                            })}
                            {/* Affiche "(modifié)" si l'annonce a été modifiée après sa création */}
                            {a.updatedAt && a.updatedAt !== a.createdAt && (
                              <span style={{ fontStyle: 'italic', marginLeft: 4 }}>(modifié)</span>
                            )}
                          </span>
                        )}
                      </small>

                      {/* Boutons Modifier et Supprimer pour l'auteur de l'annonce */}
                      {a.username === user.username && (
                        <div style={{ marginTop: 8 }}>
                          {/* Bouton Modifier en bleu */}
                          <button 
                            onClick={() => handleEditStart(a)}
                            style={{ 
                              padding: '4px 8px', 
                              backgroundColor: '#0066cc', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: '4px',
                              cursor: 'pointer',
                              marginRight: 4
                            }}
                          >
                            Modifier
                          </button>
                          {/* Bouton Supprimer en rouge */}
                          <button 
                            onClick={() => handleDelete(a.id)}
                            style={{ 
                              padding: '4px 8px', 
                              backgroundColor: '#ff4444', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            Supprimer
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
