/**
 * Mission Control App 💼
 * A Fortune 500 AI Oversight Platform
 * 
 * Routes:
 * - / : The Board Room 🏢 (Agent Dashboard)
 * - /risk-assessment : Risk Assessment 🦞 (Activity Feed)
 * - /users : Human Resources 👔 (User Management)
 * - /login : Badge In 🪪 (Authentication)
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
          {/* Badge In 🪪 - Login */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* The Board Room 🏢 - Agent Dashboard */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AgentDashboard />
              </ProtectedRoute>
            }
          />

          {/* Risk Assessment 🦞 - Activity Feed */}
          <Route
            path="/risk-assessment"
            element={
              <ProtectedRoute>
                <RiskAssessmentPage />
              </ProtectedRoute>
            }
          />

          {/* Human Resources 👔 - User Management (Admin Only) */}
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
