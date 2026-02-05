/**
 * Login Page Component
 * TKH Branded login form with email/password authentication
 */
import { useState, FormEvent, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, Loader2, Activity, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isAuthenticated, error: authError, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get redirect path from location state or default to dashboard
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Clear auth error when component unmounts or inputs change
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const validateForm = (): boolean => {
    if (!email.trim()) {
      setLocalError('Email is required');
      return false;
    }
    
    if (!email.includes('@')) {
      setLocalError('Please enter a valid email address');
      return false;
    }
    
    if (!password) {
      setLocalError('Password is required');
      return false;
    }
    
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return false;
    }
    
    setLocalError(null);
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setLocalError(null);

    try {
      await login({ email: email.trim(), password });
      // Navigation will happen via useEffect when isAuthenticated becomes true
    } catch {
      // Error is already handled in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = localError || authError;

  return (
    <div className="min-h-screen bg-tkh-blue-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Activity className="w-12 h-12 text-tkh-primary" />
            <h1 className="text-4xl font-bold text-white">
              Mission Control
            </h1>
          </div>
          <p className="text-tkh-grey">
            Agent Status Dashboard
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-tkh-line p-8">
          <h2 className="text-2xl font-bold text-tkh-blue mb-6 text-center">
            Sign In
          </h2>

          {/* Error Banner */}
          {displayError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-red-700 text-sm">{displayError}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-bold text-tkh-blue mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setLocalError(null);
                  clearError();
                }}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={isSubmitting}
                className="w-full px-4 py-3 border border-tkh-grey-light text-tkh-blue placeholder-tkh-grey focus:outline-none focus:border-tkh-primary focus:ring-2 focus:ring-tkh-primary/20 disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
              />
            </div>

            {/* Password Field */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-bold text-tkh-blue mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setLocalError(null);
                    clearError();
                  }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 pr-12 border border-tkh-grey-light text-tkh-blue placeholder-tkh-grey focus:outline-none focus:border-tkh-primary focus:ring-2 focus:ring-tkh-primary/20 disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-tkh-grey hover:text-tkh-blue transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-6 bg-tkh-primary text-tkh-blue-dark font-bold hover:bg-tkh-primary/90 focus:outline-none focus:ring-2 focus:ring-tkh-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-tkh-grey text-sm mt-6">
          Mission Control v1.0 • TKH Group
        </p>
      </div>
    </div>
  );
}
