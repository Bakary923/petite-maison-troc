import React, { createContext, useState, useCallback } from 'react';

// Contexte global d'authentification pour centraliser la gestion de session [cite: 17, 18]
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // ✅ INITIALISATION SÉCURISÉE : On traite le texte "null" comme un vrai null JavaScript
  // Cela empêche l'envoi de jetons malformés au démarrage de l'application [cite: 19]
  const [accessToken, setAccessToken] = useState(() => {
    const token = localStorage.getItem('accessToken');
    return (token === 'null' || !token) ? null : token;
  });
  
  const [refreshToken, setRefreshToken] = useState(() => {
    const token = localStorage.getItem('refreshToken');
    return (token === 'null' || !token) ? null : token;
  });

  // Chargement des données de l'utilisateur (username, role 'admin' ou 'user') [cite: 165]
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user');
    return (raw && raw !== 'null') ? JSON.parse(raw) : null;
  });

  // ============================================
  // ✅ FONCTION REFRESH : Renouvellement du jeton d'accès expiré
  // ============================================
  const refreshAccessToken = useCallback(async () => {
    // 🛡️ Vérification de la présence d'un jeton de rafraîchissement valide [cite: 24]
    if (!refreshToken || refreshToken === 'null') {
      console.log('[REFRESH] Aucun jeton de rafraîchissement disponible');
      return null;
    }

    try {
      const res = await fetch('http://localhost:3000/api/auth/refresh', {
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

      // ✅ Mise à jour du stockage local avec les nouveaux jetons [cite: 20]
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);

      console.log('[REFRESH] ✅ Nouveau jeton d\'accès généré avec succès');
      return data.accessToken;
    } catch (err) {
      console.error('[REFRESH ERROR]', err);
      logout();
      return null;
    }
  }, [refreshToken]);

  // Déconnexion : Nettoyage complet des données de session (Local et State) [cite: 86]
  const logout = useCallback(async () => {
    if (refreshToken && refreshToken !== 'null') {
      try {
        await fetch('http://localhost:3000/api/auth/logout', {
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
  // LOGIN - Authentification initiale et stockage
  // ============================================
  const login = useCallback(async ({ email, password }) => {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Identifiants de connexion invalides");
    }

    const data = await res.json();

    // ✅ Stockage persistant des jetons de session (Access: 15m, Refresh: 7j) [cite: 20]
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
  // REGISTER - Création de compte utilisateur
  // ============================================
  const register = useCallback(async ({ username, email, password }) => {
    const res = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || "Erreur lors de la création du compte");
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
  // ✅ AUTHFETCH : Wrapper Fetch sécurisé avec gestion du refresh automatique
  // ============================================
  const authFetch = useCallback(
    async (url, options = {}) => {
      const headers = { ...(options.headers || {}) };
      
      if (!(options.body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }

      // 🛡️ MODIFICATION DE SÉCURITÉ FINALE : On bloque l'envoi de "null" (texte)
      // Cela évite l'erreur "jwt malformed" (401) dans les logs de supervision [cite: 87]
      if (accessToken && accessToken !== 'null' && accessToken !== 'undefined') {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      let res = await fetch(url, { ...options, headers });

      // ✅ Gestion automatique du rafraîchissement si le serveur renvoie 401 (Token expiré) [cite: 86]
      if (res.status === 401 && refreshToken && refreshToken !== 'null') {
        console.log('[AUTHFETCH] Jeton expiré, tentative de rafraîchissement...');
        
        const newAccessToken = await refreshAccessToken();
        
        if (newAccessToken) {
          // Relance automatique de la requête initiale avec le nouveau jeton [cite: 22]
          console.log('[AUTHFETCH] Relance de la requête avec le nouveau jeton');
          headers.Authorization = `Bearer ${newAccessToken}`;
          res = await fetch(url, { ...options, headers });
        } else {
          throw new Error("Votre session a expiré, veuillez vous reconnecter");
        }
      }

      // Protection finale : Si toujours 401, on déconnecte l'utilisateur
      if (res.status === 401) {
        logout();
        throw new Error("Accès refusé (Session invalide)");
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