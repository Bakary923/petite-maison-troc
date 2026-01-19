import React, { createContext, useState, useCallback } from 'react';

// Contexte global d'authentification (user + token + fonctions)
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // user connecté (chargé depuis localStorage au démarrage)
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });

  // token JWT (chargé depuis localStorage au démarrage)
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);

  // Déconnexion : on vide le localStorage et le state React
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  // Fonction login : envoie email + password au backend, enregistre token + user
  const login = useCallback(async ({ email, password }) => {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    // Gestion des erreurs de connexion (validation + mauvais identifiants)
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));

      // Message générique pour l'utilisateur
      let msg = 'Email ou mot de passe incorrect';

      // Si une seule erreur de validation (ex: email vide), on peut utiliser son message
      if (Array.isArray(err.errors) && err.errors.length === 1) {
        msg = err.errors[0].msg;
      } else if (err.error || err.message || err.detail) {
        msg = err.error || err.message || err.detail;
      }

      throw new Error(msg);
    }

    // Si tout va bien, on récupère les données
    const data = await res.json();

    // On stocke le token JWT
    if (data.token) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
    }

    // On stocke l'utilisateur connecté
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
    }

    return data.user;
  }, []);

  // Fonction register : inscription + éventuellement login automatique
  const register = useCallback(async ({ username, email, password }) => {
    const res = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });

    // Gestion des erreurs d'inscription (dont notre validation express-validator)
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));

      // Message générique pour l'utilisateur
      let msg = 'Informations d’inscription invalides';

      // Si une seule erreur de validation, on peut afficher le détail (optionnel)
      if (Array.isArray(errBody.errors) && errBody.errors.length === 1) {
        msg = errBody.errors[0].msg;
      } else if (errBody.error || errBody.message || errBody.detail) {
        msg = errBody.error || errBody.message || errBody.detail;
      }

      // On remonte un Error vers le composant React (Signup) qui affichera msg
      throw new Error(msg);
    }

    // Si l'inscription a réussi, on lit la réponse
    const data = await res.json();

    // On stocke immédiatement token + user si le backend les renvoie
    if (data.token) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
    }
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      return data.user; // On renvoie l'utilisateur au composant appelant
    }

    // Si le backend ne renvoie pas user/token après register, on tente un login automatique
    try {
      const ldRes = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (ldRes.ok) {
        const ld = await ldRes.json();

        if (ld.token) {
          localStorage.setItem('token', ld.token);
          setToken(ld.token);
        }
        if (ld.user) {
          localStorage.setItem('user', JSON.stringify(ld.user));
          setUser(ld.user);
          return ld.user;
        }
      }
    } catch (e) {
      // Si le login automatique échoue, on ignore simplement
    }

    // Si on arrive ici, on n'a pas d'utilisateur connecté
    return null;
  }, []);

  // authFetch : helper pour faire des requêtes authentifiées (avec le token)
  const authFetch = useCallback(
    async (url, options = {}) => {
      const headers = { ...(options.headers || {}) };
      const body = options.body;

      // Si on envoie du JSON (pas un FormData), on met le bon Content-Type
      if (!(body instanceof FormData) && !headers['Content-Type'] && !headers['content-type']) {
        headers['Content-Type'] = 'application/json';
      }

      // Si on a un token, on l'ajoute dans Authorization
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(url, { ...options, headers });

      // Si le backend renvoie 401, on force la déconnexion
      if (res.status === 401) {
        logout();
        throw new Error('Non autorisé (token invalide)');
      }

      return res;
    },
    [token, logout]
  );

  // On expose tout ça au reste de l'application via le contexte
  return (
    <AuthContext.Provider value={{ user, token, login, logout, register, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}
