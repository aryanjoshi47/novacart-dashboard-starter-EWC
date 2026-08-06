import React, { createContext, useContext, useState, useEffect } from 'react';
import { authorize, logout as apiLogout } from './api';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [role,    setRole]    = useState(null);  // null = still loading
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authorize()
      .then(data => {
        setUser(data.user);
        setRole(data.role === 'admin' ? 'admin' : 'viewer');
      })
      .catch(() => {
        // If authorize fails, default to viewer — least privilege
        setRole('viewer');
      })
      .finally(() => setLoading(false));
  }, []);

  function logout() {
    setUser(null);
    setRole(null);
    apiLogout();
  }

  return (
    <UserContext.Provider value={{ user, role, loading, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
