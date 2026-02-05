/**
 * Mission Control App
 * Main application with routing and authentication
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './components/LoginPage';
import { AgentDashboard } from './components/AgentDashboard';
import { UserManagement } from './components/UserManagement';
import { RiskAssessmentPage } from './components/risk-assessment';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Route - Login */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected Route - Dashboard */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AgentDashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected Route - Risk Assessment (Activity Feed) */}
          <Route
            path="/risk-assessment"
            element={
              <ProtectedRoute>
                <RiskAssessmentPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Route - User Management (Admin Only) */}
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          
          {/* Catch-all redirect to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
