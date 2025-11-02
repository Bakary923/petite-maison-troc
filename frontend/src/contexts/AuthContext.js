import React, { createContext, useState, useCallback } from 'react';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Erreur' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
    }
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
    }
    return data.user;
  }, []);

  const register = useCallback(async ({ username, email, password }) => {
    const res = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const msg = errBody.error || errBody.message || errBody.detail || `HTTP ${res.status}`;
      throw new Error(msg);
    }

    const data = await res.json();

    if (data.token) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
    }
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    }

    // fallback login attempt
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
      // noop
    }

    return null;
  }, []);

  // authFetch : n'ajoute Content-Type JSON si body est FormData (upload)
  const authFetch = useCallback(
    async (url, options = {}) => {
      const headers = { ...(options.headers || {}) };
      const body = options.body;
      // si ce n'est pas un FormData et qu'on n'a pas déjà Content-Type, définir JSON
      if (!(body instanceof FormData) && !headers['Content-Type'] && !headers['content-type']) {
        headers['Content-Type'] = 'application/json';
      }
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(url, { ...options, headers });
      if (res.status === 401) {
        logout();
        throw new Error('Non autorisé (token invalide)');
      }
      return res;
    },
    [token, logout]
  );

  return (
    <AuthContext.Provider value={{ user, token, login, logout, register, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}