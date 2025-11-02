import React, { useState, useContext } from 'react';
import { AuthContext } from './contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Signup({ onCancel, onSuccess }) {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !email.trim() || !password) {
      setError('Tous les champs sont requis');
      return;
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    setLoading(true);
    try {
      console.log('[DEBUG SIGNUP] Appel register avec:', { username, email });
      
      const user = await register({ username: username.trim(), email: email.trim(), password });
      
      console.log('[DEBUG SIGNUP] Register réussi, user:', user);
      
      // ✅ Redirection forcée
      setTimeout(() => {
        console.log('[DEBUG SIGNUP] Redirection vers /');
        navigate('/');
      }, 500);
      
    } catch (err) {
      console.error('[ERROR SIGNUP]', err);
      setError(err.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 420, padding: 20 }}>
      <h2>Créer un compte</h2>
      {error && <div style={{ color: 'crimson', marginBottom: 8 }}>{error}</div>}
      <div style={{ marginBottom: 8 }}>
        <input
          placeholder="Nom d'utilisateur"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
      </div>
      <div style={{ marginBottom: 8 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
      </div>
      <div style={{ marginBottom: 8 }}>
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
      </div>
      <div style={{ marginBottom: 8 }}>
        <input
          type="password"
          placeholder="Confirmer le mot de passe"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          required
        />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" disabled={loading}>
          {loading ? 'Inscription...' : "S'inscrire"}
        </button>
        <button type="button" onClick={onCancel}>
          Annuler
        </button>
      </div>
    </form>
  );
}
