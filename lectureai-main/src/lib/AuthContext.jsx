import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

const defaultUser = {
  id: 'local-admin',
  name: 'Local Admin',
  role: 'admin',
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(defaultUser);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(true);
  const [appPublicSettings, setAppPublicSettings] = useState({
    id: 'standalone',
    public_settings: { mode: 'local' },
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedName = window.localStorage.getItem('lectureai_user_name');
    const storedRole = window.localStorage.getItem('lectureai_user_role');
    if (storedName || storedRole) {
      setUser((current) => ({
        ...current,
        name: storedName || current.name,
        role: storedRole || current.role,
      }));
    }
  }, []);

  const checkUserAuth = async () => {
    setUser((current) => current || defaultUser);
    setIsAuthenticated(true);
    setIsLoadingAuth(false);
    setAuthChecked(true);
    return defaultUser;
  };

  const checkAppState = async () => {
    setIsLoadingPublicSettings(false);
    setIsLoadingAuth(false);
    setAuthError(null);
    setAuthChecked(true);
    setIsAuthenticated(true);
    return appPublicSettings;
  };

  const logout = () => {
    setUser(defaultUser);
    setIsAuthenticated(true);
    setAuthError(null);
  };

  const navigateToLogin = () => {
    setIsAuthenticated(true);
    setAuthError(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
