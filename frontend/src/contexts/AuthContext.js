import React, { createContext, useState, useCallback, useContext } from 'react';
import { API_BASE_URL } from '../config';

// ============================================================================
// 🌐 CONTEXTE GLOBAL D’AUTHENTIFICATION
// ----------------------------------------------------------------------------
// Ce contexte centralise :
// - l’utilisateur connecté
// - les jetons (access / refresh)
// - login / logout / register
// - authFetch (requêtes sécurisées avec refresh automatique)
// ============================================================================

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {

  // ==========================================================================
  // 🔐 INITIALISATION SÉCURISÉE DES JETONS
  // ==========================================================================
  const [accessToken, setAccessToken] = useState(() => {
    const token = localStorage.getItem('accessToken');
    return (token === 'null' || !token) ? null : token;
  });

  const [refreshToken, setRefreshToken] = useState(() => {
    const token = localStorage.getItem('refreshToken');
    return (token === 'null' || !token) ? null : token;
  });

  // ==========================================================================
  // 👤 CHARGEMENT DE L’UTILISATEUR
  // ==========================================================================
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user');
    return (raw && raw !== 'null') ? JSON.parse(raw) : null;
  });

  // ==========================================================================
  // 🔄 REFRESH TOKEN : Renouvellement automatique du jeton expiré
  // ==========================================================================
  const refreshAccessToken = useCallback(async () => {
    if (!refreshToken || refreshToken === 'null') {
      console.log('[REFRESH] Aucun refreshToken disponible');
      return null;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        console.log('[REFRESH] Échec du refresh → logout()');
        logout();
        return null;
      }

      const data = await res.json();

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);

      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);

      console.log('[REFRESH] Nouveau jeton généré');
      return data.accessToken;

    } catch (err) {
      console.error('[REFRESH ERROR]', err);
      logout();
      return null;
    }
  }, [refreshToken]);

  // ==========================================================================
  // 🚪 LOGOUT : Nettoyage complet
  // ==========================================================================
  const logout = useCallback(async () => {
    if (refreshToken && refreshToken !== 'null') {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
      } catch (err) {
        console.error('[LOGOUT ERROR]', err);
      }
    }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');

    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  }, [refreshToken]);

  // ==========================================================================
  // 🔑 LOGIN
  // ==========================================================================
  const login = useCallback(async ({ email, password }) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Identifiants invalides");
    }

    const data = await res.json();

    if (data.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
      setAccessToken(data.accessToken);
    }

    if (data.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken);
      setRefreshToken(data.refreshToken);
    }

    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
    }

    return data.user;
  }, []);

  // ==========================================================================
  // 🆕 REGISTER
  // ==========================================================================
  const register = useCallback(async ({ username, email, password }) => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || "Erreur de création de compte");
    }

    const data = await res.json();

    if (data.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
      setAccessToken(data.accessToken);
    }

    if (data.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken);
      setRefreshToken(data.refreshToken);
    }

    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    }

    return null;
  }, []);

  // ==========================================================================
  // 🛡️ AUTHFETCH : Requêtes sécurisées + refresh automatique
  // ==========================================================================
  const authFetch = useCallback(
    async (url, options = {}) => {
      const headers = { ...(options.headers || {}) };

      if (!(options.body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }

      if (accessToken && accessToken !== 'null' && accessToken !== 'undefined') {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      let res = await fetch(url, { ...options, headers });

      if (res.status === 401 && refreshToken && refreshToken !== 'null') {
        console.log('[AUTHFETCH] Jeton expiré → refresh...');
        const newAccessToken = await refreshAccessToken();

        if (newAccessToken) {
          headers.Authorization = `Bearer ${newAccessToken}`;
          res = await fetch(url, { ...options, headers });
        } else {
          throw new Error("Session expirée");
        }
      }

      if (res.status === 401) {
        logout();
        throw new Error("Accès refusé");
      }

      return res;
    },
    [accessToken, refreshToken, refreshAccessToken, logout]
  );

  // ==========================================================================
  // 🧩 PROVIDER
  // ==========================================================================
  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        login,
        logout,
        register,
        authFetch
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================================
// 🧲 HOOK useAuth : accès simplifié au contexte
// ----------------------------------------------------------------------------
// Ce hook est indispensable pour :
// - Home.jsx
// - Navbar
// - Tests Jest
// - Toute logique conditionnelle (user connecté / non connecté)
// ============================================================================
export const useAuth = () => {
  return useContext(AuthContext);
};
