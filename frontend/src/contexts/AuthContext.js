import React, { createContext, useState, useCallback } from 'react';

// Contexte global d'authentification
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // ✅ CHANGEMENT 1 : Deux tokens au lieu d'un
  const [accessToken, setAccessToken] = useState(() => 
    localStorage.getItem('accessToken') || null
  );
  
  const [refreshToken, setRefreshToken] = useState(() => 
    localStorage.getItem('refreshToken') || null
  );

  // user connecté
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });

  // ============================================
  // ✅ CHANGEMENT 2 : Fonction pour renouveler le token
  // ============================================
  const refreshAccessToken = useCallback(async () => {
    if (!refreshToken) {
      console.log('[REFRESH] Pas de refreshToken');
      return null;
    }

    try {
      const res = await fetch('http://localhost:3000/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        console.log('[REFRESH] Refresh échoué (401)');
        logout();
        return null;
      }

      const data = await res.json();

      // ✅ Sauvegarde les nouveaux tokens
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);

      console.log('[REFRESH] ✅ Nouveau accessToken généré');
      return data.accessToken;
    } catch (err) {
      console.error('[REFRESH ERROR]', err);
      logout();
      return null;
    }
  }, [refreshToken]);

  // Déconnexion : vide le localStorage et le state
  const logout = useCallback(async () => {
    // ✅ OPTIONNEL : Appeler /logout pour supprimer le refreshToken en base
    if (refreshToken) {
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
  // LOGIN - Stocke les 2 tokens
  // ============================================
  const login = useCallback(async ({ email, password }) => {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      let msg = "Email ou mot de passe incorrect";
      if (Array.isArray(err.errors) && err.errors.length === 1) {
        msg = err.errors[0].msg;
      } else if (err.error || err.message || err.detail) {
        msg = err.error || err.message || err.detail;
      }
      throw new Error(msg);
    }

    const data = await res.json();

    // ✅ CHANGEMENT 3 : Stocker les 2 tokens
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
  // REGISTER - Stocke les 2 tokens
  // ============================================
  const register = useCallback(async ({ username, email, password }) => {
    const res = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      let msg = "Informations d\'inscription invalides";
      if (Array.isArray(errBody.errors) && errBody.errors.length === 1) {
        msg = errBody.errors[0].msg;
      } else if (errBody.error || errBody.message || errBody.detail) {
        msg = errBody.error || errBody.message || errBody.detail;
      }
      throw new Error(msg);
    }

    const data = await res.json();

    // ✅ CHANGEMENT 4 : Stocker les 2 tokens
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
  // ✅ CHANGEMENT 5 : authFetch avec auto-refresh
  // ============================================
  const authFetch = useCallback(
    async (url, options = {}) => {
      const headers = { ...(options.headers || {}) };
      const body = options.body;

      // Ajoute le Content-Type si nécessaire
      if (!(body instanceof FormData) && !headers['Content-Type'] && !headers['content-type']) {
        headers['Content-Type'] = 'application/json';
      }

      // Ajoute l'accessToken si présent
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      let res = await fetch(url, { ...options, headers });

      // ✅ Si 401 (token expiré) : tenter un refresh
      if (res.status === 401 && refreshToken) {
        console.log('[AUTHFETCH] 401 reçu, tentative de refresh...');
        
        const newAccessToken = await refreshAccessToken();
        
        if (newAccessToken) {
          // Retry la requête avec le nouveau token
          console.log('[AUTHFETCH] Retry avec nouveau token');
          headers.Authorization = `Bearer ${newAccessToken}`;
          res = await fetch(url, { ...options, headers });
        } else {
          // Refresh échoué → déconnexion
          throw new Error("Session expirée, veuillez vous reconnecter");
        }
      }

      // Si toujours 401 après refresh → déconnexion
      if (res.status === 401) {
        logout();
        throw new Error("Non autorisé (session invalide)");
      }

      return res;
    },
    [accessToken, refreshToken, refreshAccessToken, logout]
  );

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        accessToken,           // ✅ Expose accessToken
        refreshToken,          // ✅ Expose refreshToken
        login, 
        logout, 
        register, 
        authFetch,
        refreshAccessToken     // ✅ Expose la fonction de refresh
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/*
CHANGEMENTS EFFECTUÉS :
1. ✅ Deux tokens au lieu d'un (accessToken + refreshToken)
2. ✅ Fonction refreshAccessToken() pour renouveler automatiquement
3. ✅ login/register stockent les 2 tokens
4. ✅ authFetch gère automatiquement le refresh quand 401
5. ✅ logout optionnellement appelle /api/auth/logout
6. ✅ Expose les tokens et la fonction de refresh pour les composants

FLUX :
- User se connecte → reçoit 2 tokens
- Utilise authFetch pour les requêtes protégées
- Si accessToken expire → auto-refresh automatique (transparent pour l'user)
- Si refresh échoue → déconnexion
- User clique logout → supprime les tokens
*/
