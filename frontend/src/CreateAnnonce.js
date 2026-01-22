import React, { useState, useContext } from 'react';
import { AuthContext } from './contexts/AuthContext';
import { useNavigate } from 'react-router-dom'; // ✅ navigation après création

export default function CreateAnnonce({ onCreate, onCancel }) {
  const { authFetch } = useContext(AuthContext);
  const navigate = useNavigate();
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setImageFile(e.target.files?.[0] || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Petit contrôle front basique
    if (!titre.trim() || !description.trim()) {
      setError('Titre et description requis');
      return;
    }

    setLoading(true);

    try {
      let res;

      // Si une image est choisie : on envoie en FormData
      if (imageFile) {
        const fd = new FormData();
        fd.append('titre', titre.trim());
        fd.append('description', description.trim());
        fd.append('image', imageFile);
        res = await authFetch('http://localhost:3000/api/annonces', {
          method: 'POST',
          body: fd,
        });
      } else {
        // Sinon, JSON classique
        res = await authFetch('http://localhost:3000/api/annonces', {
          method: 'POST',
          body: JSON.stringify({
            titre: titre.trim(),
            description: description.trim(),
          }),
        });
      }

      // Gestion des erreurs HTTP (ex: 400 de validation)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg =
          body.error ||                          // erreur simple { error: '...' }
          body.message ||                        // { message: '...' }
          (body.errors && body.errors[0]?.msg) ||// 1er message express-validator
          `HTTP ${res.status}`;                  // fallback
        throw new Error(msg);
      }

      const data = await res.json().catch(() => null);
      const created = data?.annonce || data || null;

      // Prévenir le parent si besoin
      if (typeof onCreate === 'function') onCreate(created);

      // Reset du formulaire
      setTitre('');
      setDescription('');
      setImageFile(null);
      if (typeof onCancel === 'function') onCancel();

      // Redirection vers la liste des annonces
      setTimeout(() => {
        console.log('[DEBUG] Redirection vers /annonces');
        navigate('/annonces');
      }, 500);
    } catch (err) {
      // Affichage du message d’erreur lisible sur la page
      setError(err.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ maxWidth: 600, padding: 12, border: '1px solid #ddd', borderRadius: 6 }}
    >
      <h3>Nouvelle annonce</h3>

      {/* Zone d'affichage des erreurs lisibles */}
      {error && <div style={{ color: 'crimson', marginBottom: 8 }}>{error}</div>}

      <div style={{ marginBottom: 8 }}>
        <input
          placeholder="Titre"
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          required
          style={{ width: '100%', padding: 8 }}
        />
      </div>

      <div style={{ marginBottom: 8 }}>
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={4}
          style={{ width: '100%', padding: 8 }}
        />
      </div>

      <div style={{ marginBottom: 8 }}>
        <input type="file" accept="image/*" onChange={handleFileChange} />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" disabled={loading}>
          {loading ? 'Publication...' : 'Publier'}
        </button>
        <button type="button" onClick={onCancel}>
          Annuler
        </button>
      </div>
    </form>
  );
}
