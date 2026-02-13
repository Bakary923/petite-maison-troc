import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

// 👉 Import du client Supabase
import { supabase } from "../supabaseClient";

export default function CreateAnnonce({ onCreate, onCancel }) {
  const { authFetch } = useContext(AuthContext);
  const navigate = useNavigate();

  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 📌 Sélection du fichier image
  const handleFileChange = (e) => {
    setImageFile(e.target.files?.[0] || null);
  };

  // 📌 Upload direct vers Supabase Storage
  async function uploadImageToSupabase(file) {
    const fileName = `${Date.now()}-${file.name}`;

    const { data, error } = await supabase.storage
      .from("ANNONCES-IMAGES")
      .upload(fileName, file);

    if (error) {
      console.error("❌ Erreur Supabase :", error);
      throw new Error("Échec de l'upload de l'image");
    }

    return data.path; // 👉 On renvoie juste le chemin
  }

  // 📌 Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!titre.trim() || !description.trim()) {
      setError('Titre et description requis');
      return;
    }

    setLoading(true);

    try {
      let imagePath = null;

      // 👉 Étape 1 : upload direct vers Supabase (si image)
      if (imageFile) {
        imagePath = await uploadImageToSupabase(imageFile);
      }

      // 👉 Étape 2 : envoi des données au backend (JSON simple)
      const res = await authFetch(`${API_BASE_URL}/annonces`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titre: titre.trim(),
          description: description.trim(),
          imagePath, // 👉 On envoie juste le chemin
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || body.message || `HTTP ${res.status}`);
      }

      const data = await res.json().catch(() => null);
      const created = data?.annonce || data || null;

      if (typeof onCreate === 'function') onCreate(created);

      // Reset du formulaire
      setTitre('');
      setDescription('');
      setImageFile(null);

      // Redirection
      setTimeout(() => navigate('/annonces'), 500);

    } catch (err) {
      setError(err.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.formWrapper}>
          <div style={styles.formHeader}>
            <h1 style={styles.title}>Proposer un article</h1>
            <p style={styles.subtitle}>Partagez un objet à échanger ou donner</p>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            
            {error && (
              <div style={styles.errorBox}>
                <span style={styles.errorIcon}>⚠️</span>
                {error}
              </div>
            )}

            {/* TITRE */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Titre de l'article *</label>
              <input
                type="text"
                placeholder="Ex: Vélo bleu en bon état"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                required
                style={styles.input}
              />
            </div>

            {/* DESCRIPTION */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Description *</label>
              <textarea
                placeholder="Décrivez l'article : état, caractéristiques..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={6}
                style={styles.textarea}
              />
            </div>

            {/* IMAGE */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Image (optionnel)</label>
              <div style={styles.fileInputWrapper}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={styles.fileInput}
                  id="image-input"
                />
                <label htmlFor="image-input" style={styles.fileLabel}>
                  {imageFile ? `✓ ${imageFile.name}` : "📎 Cliquez pour sélectionner une image"}
                </label>
              </div>
            </div>

            {/* ACTIONS */}
            <div style={styles.actions}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  ...styles.submitButton,
                  opacity: loading ? 0.6 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Publication en cours...' : 'Publier l\'annonce'}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (typeof onCancel === 'function') onCancel();
                  navigate('/annonces');
                }}
                style={styles.cancelButton}
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


// 🎨 Styles (inchangés)
const styles = {
  page: {
    minHeight: '100vh',
    background: 'radial-gradient(circle at 0% 0%, #1f2937 0, transparent 50%), radial-gradient(circle at 100% 100%, #7f1d1d 0, transparent 50%), linear-gradient(135deg, #020617, #020617)',
    color: '#F9FAFB',
    padding: '60px 20px',
  },
  container: { maxWidth: '600px', margin: '0 auto' },
  formWrapper: {
    borderRadius: 28,
    border: '1px solid rgba(148, 163, 184, 0.4)',
    background: 'rgba(15, 23, 42, 0.92)',
    boxShadow: '0 32px 100px rgba(0, 0, 0, 0.85)',
    padding: 40,
    backdropFilter: 'blur(20px)',
  },
  formHeader: { marginBottom: 32 },
  title: { fontSize: 32, fontWeight: 700, margin: '0 0 12px 0' },
  subtitle: { fontSize: 16, color: '#9CA3AF', margin: 0 },
  form: { display: 'flex', flexDirection: 'column', gap: 24 },
  formGroup: { display: 'flex', flexDirection: 'column', gap: 8 },
  label: { fontSize: 14, fontWeight: 600, color: '#E5E7EB', textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: { padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(31, 41, 55, 0.9)', background: 'rgba(15, 23, 42, 0.8)', color: '#F9FAFB', fontSize: 14 },
  textarea: { padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(31, 41, 55, 0.9)', background: 'rgba(15, 23, 42, 0.8)', color: '#F9FAFB', fontSize: 14, resize: 'vertical' },
  fileInput: { display: 'none' },
  fileLabel: { display: 'block', padding: '12px 16px', borderRadius: 12, border: '1px dashed rgba(249, 115, 22, 0.5)', background: 'rgba(249, 115, 22, 0.08)', color: '#E5E7EB', textAlign: 'center', cursor: 'pointer' },
  actions: { display: 'flex', gap: 12, flexDirection: 'column', marginTop: 12 },
  submitButton: { padding: '14px 32px', borderRadius: 999, border: 'none', background: 'radial-gradient(circle at 0 0, rgba(249,115,22,0.4), rgba(249,115,22,0.95))', color: '#020617', fontWeight: 700, textTransform: 'uppercase', boxShadow: '0 0 28px rgba(249,115,22,0.6)' },
  cancelButton: { padding: '14px 32px', borderRadius: 999, border: '1px solid rgba(148, 163, 184, 0.6)', background: 'transparent', color: '#E5E7EB', fontWeight: 600, textTransform: 'uppercase' },
  errorBox: { padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(239, 68, 68, 0.5)', background: 'rgba(239, 68, 68, 0.15)', color: '#fecaca', display: 'flex', gap: 8, alignItems: 'center' },
};
