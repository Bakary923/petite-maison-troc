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
  
  // État pour gérer le chargement (affiche "Chargement..." pendant que la requête se fait)
  const [loading, setLoading] = useState(true);
  
  // État pour afficher les erreurs potentielles
  const [error, setError] = useState(null);
  
  // État pour afficher/masquer le formulaire de création d'annonce
  const [showCreate, setShowCreate] = useState(false);

  // Fonction asynchrone pour récupérer toutes les annonces du backend
  const fetchAnnonces = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Appel API GET pour récupérer les annonces
      const res = await authFetch('http://localhost:3000/api/annonces');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      // Parse la réponse JSON
      const data = await res.json();
      
      // Mets à jour l'état avec les annonces reçues
      setAnnonces(data.annonces || []);
    } catch (err) {
      // En cas d'erreur, affiche le message d'erreur
      setError(err.message || 'Erreur réseau');
    } finally {
      // Arrête le chargement une fois la requête terminée
      setLoading(false);
    }
  }, [authFetch]);

  // Récupère les annonces au montage du composant
  useEffect(() => {
    fetchAnnonces();
  }, [fetchAnnonces]);

  // Fonction appelée quand une nouvelle annonce est créée
  const handleCreate = async (newAnnonce) => {
    // Si le backend a renvoyé l'annonce créée
    if (newAnnonce) {
      // Normalise l'objet (peut être newAnnonce.annonce ou directement newAnnonce)
      const a = newAnnonce.annonce || newAnnonce;
      
      // Ajoute la nouvelle annonce en tête de la liste (sans doublons)
      setAnnonces(prev => {
        // Vérifie que l'annonce n'existe pas déjà dans la liste
        const exists = a && (prev.some(p => (p.id && a.id && p.id === a.id) || (p._id && a._id && p._id === a._id)));
        if (exists) return prev;
        
        // Ajoute la nouvelle annonce en tête
        return a ? [a, ...prev] : prev;
      });
      return;
    }

    // Si le backend n'a pas renvoyé l'annonce, rafraîchit complètement la liste
    await fetchAnnonces();
  };

  // Si l'utilisateur n'est pas connecté, affiche la page de login
  if (!user) return <Login />;

  // Affichage du composant principal
  return (
    <div className="App" style={{ padding: 20 }}>
      {/* En-tête avec titre et boutons utilisateur */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Annonces - Espace Troc</h1>
        <div>
          {/* Affiche le pseudo de l'utilisateur connecté */}
          <span style={{ marginRight: 12 }}>Bonjour, {user.username}</span>
          
          {/* Bouton pour se déconnecter */}
          <button onClick={logout}>Se déconnecter</button>
        </div>
      </header>

      {/* Contenu principal */}
      <main style={{ marginTop: 18 }}>
        {/* Bouton pour afficher/masquer le formulaire de création d'annonce */}
        <div style={{ marginBottom: 16 }}>
          <button onClick={() => setShowCreate(s => !s)}>
            {showCreate ? 'Fermer' : 'Créer une annonce'}
          </button>
        </div>

        {/* Affiche le formulaire de création si showCreate est true */}
        {showCreate && (
          <CreateAnnonce
            onCreate={handleCreate}
            onCancel={() => setShowCreate(false)}
          />
        )}

        {/* Affiche "Chargement..." pendant que les annonces se chargent */}
        {loading && <p>Chargement des annonces…</p>}
        
        {/* Affiche l'erreur s'il y en a une */}
        {error && <p style={{ color: 'crimson' }}>Erreur : {error}</p>}
        
        {/* Affiche la liste des annonces une fois chargées */}
        {!loading && !error && (
          annonces.length === 0 ? 
            <p>Aucune annonce pour le moment.</p> :
            <ul style={{ marginTop: 12 }}>
              {/* Boucle sur chaque annonce pour l'afficher */}
              {annonces.map(a => (
                <li key={a.id || a._id || `${a.titre}-${Math.random()}`} style={{ marginBottom: 12, padding: 8, borderBottom: '1px solid #eee' }}>
                  {/* Titre de l'annonce */}
                  <strong>{a.titre}</strong><br />
                  
                  {/* Description de l'annonce */}
                  <div style={{ whiteSpace: 'pre-wrap' }}>{a.description}</div>
                  
                  {/* AFFICHAGE DE L'IMAGE - VÉRIFIE D'ABORD SI a.image EXISTE */}
                  {a.image && (
                    <div style={{ marginTop: 8, marginBottom: 8 }}>
                      {/* Balise img : affiche l'image depuis l'URL reçue du backend */}
                      <img 
                        src={a.image}                           // URL de l'image (ex: http://localhost:3000/uploads/...)
                        alt={a.titre}                           // Texte alternatif si l'image ne charge pas
                        style={{ 
                          maxWidth: '100%',                     // L'image ne dépasse pas la largeur du conteneur
                          maxHeight: 300,                       // L'image ne dépasse pas 300px de hauteur
                          objectFit: 'contain'                  // L'image se redimensionne proprement sans déformation
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Affiche le nom de l'auteur de l'annonce */}
                  <small>Par {a.username}</small>
                </li>
              ))}
            </ul>
        )}
      </main>
    </div>
  );
}

// Wrapper du composant avec le contexte d'authentification
export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
