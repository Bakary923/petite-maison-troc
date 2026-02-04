import React, { createContext, useState, useCallback, useEffect } from 'react';
import { API_BASE_URL } from '../config';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  /**
   * ===========================
   * LOGIN
   * ===========================
   */
  const login = useCallback(async ({ email, password }) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!res.ok) throw new Error('Identifiants invalides');

    const data = await res.json();

    // Regroupement des mises à jour pour éviter les warnings React 19
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    setUser(data.user);

    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
  }, []);

  /**
   * ===========================
   * LOGOUT
   * ===========================
   */
  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');

    // ⚠️ IMPORTANT : regrouper les setState pour éviter les warnings act()
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  }, []);

  /**
   * ===========================
   * AUTHFETCH (wrapper sécurisé)
   * ===========================
   */
  const authFetch = useCallback(
    async (url, options = {}) => {
      const headers = options.headers || {};

      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const res = await fetch(url, { ...options, headers });

      // Gestion du token expiré
      if (res.status === 401 && refreshToken) {
        const refreshRes = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();

          // Mise à jour groupée (React 19 friendly)
          setAccessToken(data.accessToken);
          localStorage.setItem('accessToken', data.accessToken);

          // Rejouer la requête initiale
          return authFetch(url, options);
        } else {
          logout();
        }
      }

      return res;
    },
    [accessToken, refreshToken, logout]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        login,
        logout,
        authFetch
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
