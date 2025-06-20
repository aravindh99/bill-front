import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Function to decode JWT token
const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Set up axios defaults - use relative URLs to work with Vite proxy
  axios.defaults.baseURL = '';

  // Check for JWT token in URL and localStorage
  useEffect(() => {
    const checkAuth = () => {
      // DEVELOPMENT MODE: Use valid JWT token
      // TODO: Remove this when implementing real authentication
      const validDevToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6IkRldmVsb3BtZW50IFVzZXIiLCJyb2xlIjoiYWRtaW4iLCJlbWFpbCI6ImRldkBleGFtcGxlLmNvbSIsImlhdCI6MTc1MDMzMDcxNywiZXhwIjoxNzU4OTcwNzE3fQ.lTAjsuminCb0QjP38KE_mN8sSagCXgb3vGpO630Mn8w';
      
      const dummyUser = {
        id: 1,
        name: 'Development User',
        role: 'admin',
        email: 'dev@example.com'
      };
      
      setUser(dummyUser);
      setIsAuthenticated(true);
      setLoading(false);
      
      // Set the valid JWT token for API calls
      axios.defaults.headers.common['Authorization'] = `Bearer ${validDevToken}`;
      
      // Also set up an axios interceptor to ensure token is always included
      axios.interceptors.request.use(
        (config) => {
          // Add token to all requests
          if (!config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${validDevToken}`;
          }
          return config;
        },
        (error) => {
          return Promise.reject(error);
        }
      );
      
      // Comment out the real authentication logic for now
      /*
      // First check URL parameters for token
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');
      
      if (urlToken) {
        // Store token from URL
        localStorage.setItem('token', urlToken);
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      // Check localStorage for token
      const token = localStorage.getItem('token');
      
      if (token) {
        const decodedToken = decodeToken(token);
        if (decodedToken && decodedToken.exp * 1000 > Date.now()) {
          // Token is valid
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          setUser({
            id: decodedToken.id,
            name: decodedToken.name,
            role: decodedToken.role,
            email: decodedToken.email
          });
          setIsAuthenticated(true);
        } else {
          // Token is expired or invalid
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
        }
      }
      
      setLoading(false);
      */
    };

    checkAuth();
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 