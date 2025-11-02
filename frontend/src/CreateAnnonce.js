import React, { useState, useContext } from 'react';
import { AuthContext } from './contexts/AuthContext';

export default function CreateAnnonce({ onCreate, onCancel }) {
  const { authFetch } = useContext(AuthContext);
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
    if (!titre.trim() || !description.trim()) {
      setError('Titre et description requis');
      return;
    }
    setLoading(true);

    try {
      let res;
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
        res = await authFetch('http://localhost:3000/api/annonces', {
          method: 'POST',
          body: JSON.stringify({ titre: titre.trim(), description: description.trim() }),
        });
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || body.message || `HTTP ${res.status}`);
      }

      const data = await res.json().catch(() => null);
      const created = data?.annonce || data || null;

      // appeler parent : si created null, App.handleCreate fera le refetch
      if (typeof onCreate === 'function') onCreate(created);

      // reset + fermer le formulaire
      setTitre('');
      setDescription('');
      setImageFile(null);
      if (typeof onCancel === 'function') onCancel();
    } catch (err) {
      setError(err.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 600, padding: 12, border: '1px solid #ddd', borderRadius: 6 }}>
      <h3>Nouvelle annonce</h3>
      {error && <div style={{ color: 'crimson', marginBottom: 8 }}>{error}</div>}
      <div style={{ marginBottom: 8 }}>
        <input
          placeholder="Titre"
          value={titre}
          onChange={e => setTitre(e.target.value)}
          required
          style={{ width: '100%', padding: 8 }}
        />
      </div>
      <div style={{ marginBottom: 8 }}>
        <textarea
          placeholder="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          required
          rows={4}
          style={{ width: '100%', padding: 8 }}
        />
      </div>
      <div style={{ marginBottom: 8 }}>
        <input type="file" accept="image/*" onChange={handleFileChange} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" disabled={loading}>{loading ? 'Publication...' : 'Publier'}</button>
        <button type="button" onClick={onCancel}>Annuler</button>
      </div>
    </form>
  );
}