import React, { useState, useContext } from 'react';
import { AuthContext } from './contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Signup from './signup';

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSignup, setShowSignup] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ email: email.trim(), password });
      // Redirection vers l'accueil après connexion réussie
      navigate('/');
    } catch (err) {
      setError(err.message || 'Échec de la connexion');
    } finally {
      setLoading(false);
    }
  };

  if (showSignup) {
    return (
      <Signup
        onCancel={() => setShowSignup(false)}
        onSuccess={() => navigate('/')}  // ✅ PASSE navigate au Signup
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 420, padding: 20 }}>
      <h2>Se connecter</h2>
      {error && <div style={{ color: 'crimson', marginBottom: 8 }}>{error}</div>}
      <div style={{ marginBottom: 8 }}>
        <input
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoComplete="username"
        />
      </div>
      <div style={{ marginBottom: 8 }}>
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" disabled={loading}>
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
        <button type="button" onClick={() => setShowSignup(true)}>
          Créer un compte
        </button>
      </div>
    </form>
  );
}
