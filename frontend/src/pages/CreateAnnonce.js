import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
// ✅ IMPORT DU CLIENT SUPABASE
import { supabase } from '../config/supabaseClient';

export default function CreateAnnonce() {
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

    if (!titre.trim() || !description.trim()) {
      setError('Titre et description requis');
      return;
    }

    setLoading(true);

    try {
      let imagePath = 'default-annonce.jpg';

      // ✅ ÉTAPE 1 : UPLOAD DIRECT VERS SUPABASE
      if (imageFile) {
        // Sécurité : Limite 5Mo
        if (imageFile.size > 5 * 1024 * 1024) throw new Error("Image trop lourde (max 5 Mo)");

        // Renommage propre pour éviter les doublons dans le bucket
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        // L'upload utilise maintenant la politique "public" du bucket
        const { data, error: uploadError } = await supabase.storage
          .from('annonces-images')
          .upload(fileName, imageFile);

        if (uploadError) {
          console.error("Détails erreur Supabase:", uploadError);
          throw new Error(`Erreur Stockage: ${uploadError.message}`);
        }
        
        imagePath = data.path; 
      }

      // ✅ ÉTAPE 2 : ENVOI JSON AU BACKEND (Sécurisé par ton AuthContext)
      const res = await authFetch(`${API_BASE_URL}/annonces`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titre: titre.trim(),
          description: description.trim(),
          image: imagePath, 
        }),
      });

      if (!res.ok) throw new Error('Erreur lors de la création de l\'annonce sur le serveur');

      navigate('/annonces');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h2 style={styles.title}>👻 Nouvelle Annonce (Cloud-Native)</h2>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            style={styles.input}
            placeholder="Titre (ex: Maison hantée)"
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
          />
          <textarea
            style={styles.textarea}
            placeholder="Décrivez les phénomènes paranormaux..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div style={styles.fileGroup}>
            <label style={styles.fileLabel}>
              {imageFile ? `📸 ${imageFile.name}` : "📎 Joindre une photo (Max 5Mo)"}
              <input type="file" style={{ display: 'none' }} onChange={handleFileChange} accept="image/*" />
            </label>
          </div>
          <button type="submit" disabled={loading} style={styles.submitButton}>
            {loading ? 'Téléchargement Cloud...' : 'Publier l\'annonce'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: '60px 20px', minHeight: '100vh', background: '#020617' },
  container: { maxWidth: 550, margin: '0 auto', background: 'rgba(15, 23, 42, 0.95)', padding: 40, borderRadius: 20, border: '1px solid #1e293b' },
  title: { color: '#f97316', textAlign: 'center', marginBottom: 30, fontSize: '24px' },
  error: { color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: 12, borderRadius: 8, marginBottom: 20, textAlign: 'center' },
  form: { display: 'flex', flexDirection: 'column', gap: 20 },
  input: { padding: 14, borderRadius: 12, border: '1px solid #334155', background: '#0f172a', color: 'white', fontSize: '16px' },
  textarea: { padding: 14, borderRadius: 12, border: '1px solid #334155', background: '#0f172a', color: 'white', minHeight: 120, fontSize: '16px', resize: 'vertical' },
  fileLabel: { padding: 15, border: '2px dashed #f97316', borderRadius: 12, color: '#f97316', textAlign: 'center', cursor: 'pointer', display: 'block', transition: '0.3s' },
  submitButton: { padding: 16, background: '#f97316', color: 'white', border: 'none', borderRadius: 12, fontWeight: 'bold', cursor: 'pointer', fontSize: 16, transition: '0.3s' }
};