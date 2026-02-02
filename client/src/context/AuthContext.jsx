import React, { createContext, useContext, useState } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const name = localStorage.getItem('name');
    const email = localStorage.getItem('email');
    const avatar = localStorage.getItem('avatar');
    return token ? { token, role, name, email, avatar } : null;
  });

  const login = (tokenOrData, role, name, email, avatar = null) => {
    const normalized = (() => {
      if (tokenOrData && typeof tokenOrData === 'object') {
        const data = tokenOrData;
        const token = data.token;
        const derivedRole = data.role;
        const derivedName = data.name || data.username || data.email;
        const derivedEmail = data.email;
        const derivedAvatar = data.avatar ?? null;
        return { token, role: derivedRole, name: derivedName, email: derivedEmail, avatar: derivedAvatar };
      }
      return { token: tokenOrData, role, name, email, avatar };
    })();

    if (!normalized?.token) {
      return;
    }

    localStorage.setItem('token', normalized.token);
    if (normalized.role != null) localStorage.setItem('role', normalized.role);
    if (normalized.name != null) localStorage.setItem('name', normalized.name);
    if (normalized.email != null) localStorage.setItem('email', normalized.email);
    if (normalized.avatar) localStorage.setItem('avatar', normalized.avatar);

    localStorage.setItem('user', JSON.stringify(normalized));
    setAuth(normalized);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    localStorage.removeItem('email');
    localStorage.removeItem('avatar');
    localStorage.removeItem('user');
    setAuth(null);
  };

  const updateAvatar = (avatar) => {
    if (!avatar) {
      localStorage.removeItem('avatar');
      setAuth(prev => {
        if (!prev) return prev;
        const next = { ...prev, avatar: null };
        localStorage.setItem('user', JSON.stringify(next));
        return next;
      });
      return;
    }
    localStorage.setItem('avatar', avatar);
    setAuth(prev => {
      if (!prev) return prev;
      const next = { ...prev, avatar };
      localStorage.setItem('user', JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ auth, user: auth, login, logout, updateAvatar }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
