import React, { createContext, useState, useCallback } from 'react';
// ✅ DÉCOUPLAGE : Import de l'URL centralisée pour permettre au Frontend de s'adapter 
// aux différents environnements (Docker, Minikube, OpenShift) sans modifier le code.
import { API_BASE_URL } from '../config';

// Contexte global d'authentification pour centraliser la gestion de session
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // ✅ FIABILITÉ (ISO 25010) : Initialisation sécurisée traitant le texte "null" comme un vrai null.
  // Cela évite l'envoi de jetons malformés lors des premiers appels API.
  const [accessToken, setAccessToken] = useState(() => {
    const token = localStorage.getItem('accessToken');
    return (token === 'null' || !token) ? null : token;
  });
  
  const [refreshToken, setRefreshToken] = useState(() => {
    const token = localStorage.getItem('refreshToken');
    return (token === 'null' || !token) ? null : token;
  });

  // Chargement des données utilisateur (username, role) depuis le stockage local.
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user');
    return (raw && raw !== 'null') ? JSON.parse(raw) : null;
  });

  // ============================================
  // ✅ FONCTION REFRESH : Renouvellement dynamique du jeton expiré
  // ============================================
  const refreshAccessToken = useCallback(async () => {
    // 🛡️ SÉCURITÉ : Vérification de la présence d'un jeton de rafraîchissement.
    if (!refreshToken || refreshToken === 'null') {
      console.log('[REFRESH] Aucun jeton de rafraîchissement disponible');
      return null;
    }

    try {
      // ✅ APPEL DYNAMIQUE : Utilisation de API_BASE_URL configurée pour le tunnel Minikube.
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        console.log('[REFRESH] Échec du renouvellement de session');
        logout();
        return null;
      }

      const data = await res.json();

      // Mise à jour du stockage persistant avec les nouveaux secrets.
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);

      console.log('[REFRESH] ✅ Nouveau jeton d\'accès généré via Minikube');
      return data.accessToken;
    } catch (err) {
      console.error('[REFRESH ERROR]', err);
      logout();
      return null;
    }
  }, [refreshToken]);

  // ============================================
  // DÉCONNEXION : Nettoyage des données (Local et State)
  // ============================================
  const logout = useCallback(async () => {
    if (refreshToken && refreshToken !== 'null') {
      try {
        // ✅ APPEL DYNAMIQUE : Notification au serveur via l'URL de l'orchestrateur.
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

  // ============================================
  // LOGIN - Authentification initiale
  // ============================================
  const login = useCallback(async ({ email, password }) => {
    // ✅ APPEL DYNAMIQUE : Connexion vers le tunnel backend de Minikube.
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

    // Persistance des jetons (Access: 15m, Refresh: 7j).
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

  // ============================================
  // REGISTER - Création de compte
  // ============================================
  const register = useCallback(async ({ username, email, password }) => {
    // ✅ APPEL DYNAMIQUE : Création d'utilisateur via l'API orchestrée
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

  // ============================================
  // ✅ AUTHFETCH : Intercepteur sécurisé avec refresh automatique
  // ============================================
  const authFetch = useCallback(
    async (url, options = {}) => {
      const headers = { ...(options.headers || {}) };
      
      if (!(options.body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }

      // ✅ OBSERVABILITÉ : On bloque l'envoi de jetons "null" ou "undefined" en tant que chaîne de caractères.
      // Cela évite les erreurs "JWT Malformed" inutiles dans les logs du backend.
      if (accessToken && accessToken !== 'null' && accessToken !== 'undefined') {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      let res = await fetch(url, { ...options, headers });

      // ✅ GESTION DU CYCLE DE VIE DU JETON : Refresh automatique sur erreur 401.
      if (res.status === 401 && refreshToken && refreshToken !== 'null') {
        console.log('[AUTHFETCH] Jeton expiré, tentative de rafraîchissement...');
        
        const newAccessToken = await refreshAccessToken();
        
        if (newAccessToken) {
          // Relance automatique de la requête avec le nouveau jeton.
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
/*
RÉSUMÉ DES CONTRÔLES INTÉGRÉS :
- ✅ Fiabilité (ISO 25010) : Gestion des états de jetons "null" pour éviter les crashs client[cite: 35].
- ✅ Sécurité : Système d'authentification robuste avec rotation des jetons (Access/Refresh)[cite: 24].
- ✅ Observabilité : Nettoyage des headers Authorization pour des logs backend exploitables[cite: 87].
*/