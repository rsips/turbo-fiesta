/**
 * Authentication Context Provider
 * Manages JWT tokens, user state, and auth flow
 */
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, LoginCredentials, AuthContextType } from '../types/auth';
import { login as apiLogin, getCurrentUser } from '../api/auth';
import { setupAuthInterceptor, removeAuthInterceptor } from '../api/interceptors';

const TOKEN_KEY = 'mission_control_token';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY);
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    removeAuthInterceptor();
  }, []);

  // Verify token and fetch user on mount
  useEffect(() => {
    async function verifyToken() {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await getCurrentUser(storedToken);
        setUser(userData);
        setToken(storedToken);
        setupAuthInterceptor(storedToken, logout);
      } catch (err) {
        // Token is invalid or expired
        console.warn('Token verification failed:', err);
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    verifyToken();
  }, [logout]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiLogin(credentials);
      
      // Store token
      localStorage.setItem(TOKEN_KEY, response.token);
      setToken(response.token);
      setUser(response.user);
      
      // Setup axios interceptor
      setupAuthInterceptor(response.token, logout);
    } catch (err) {
      let errorMessage = 'An unexpected error occurred';
      
      if (err instanceof Error) {
        // Handle axios errors
        const axiosError = err as { response?: { status?: number; data?: { message?: string } } };
        
        if (axiosError.response) {
          const status = axiosError.response.status;
          const message = axiosError.response.data?.message;
          
          if (status === 401) {
            errorMessage = 'Invalid email or password';
          } else if (status === 400) {
            errorMessage = message || 'Invalid request';
          } else if (status === 500) {
            errorMessage = 'Server error. Please try again later.';
          } else {
            errorMessage = message || 'Authentication failed';
          }
        } else if (err.message.includes('Network Error') || err.message.includes('timeout')) {
          errorMessage = 'Unable to connect to server. Please check your connection.';
        }
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    logout,
    error,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
