import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { StripeProvider } from './contexts/StripeContext';
import { UserProvider } from './contexts/UserContext';
import DashboardLayout from './components/DashboardLayout';
import FreeDashboard from './pages/FreeDashboard';
import StarterDashboard from './pages/StarterDashboard';
import ProDashboard from './pages/ProDashboard';
import EnterpriseDashboard from './pages/EnterpriseDashboard';
import SuccessPage from './pages/SuccessPage';
import AISEOProtected from './components/AISEOProtected';
import LoginForm from './components/LoginForm';
import GetStartedForm from './components/GetStartedForm';
import PlanProtectedRoute from './components/PlanProtectedRoute';

// Kids-AI Components
import KidsAIDirectory from './pages/KidsAIDirectory';
import StoryCreator from './pages/kids-ai-apps/StoryCreator';
import MathWizard from './pages/kids-ai-apps/MathWizard';

import './App.css';

function App() {
  return (
    <StripeProvider>
      <UserProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Authentication Routes */}
              <Route path="/login" element={<LoginForm />} />
              <Route path="/get-started" element={<GetStartedForm />} />
              
              {/* Dashboard Routes with Plan Protection */}
              <Route path="/dashboard" element={<Navigate to="/dashboard/free" replace />} />
              
              <Route path="/dashboard/free" element={
                <PlanProtectedRoute requiredPlan="free">
                  <DashboardLayout plan="free">
                    <FreeDashboard />
                  </DashboardLayout>
                </PlanProtectedRoute>
              } />
              
              <Route path="/dashboard/starter" element={
                <PlanProtectedRoute requiredPlan="starter">
                  <DashboardLayout plan="starter">
                    <StarterDashboard />
                  </DashboardLayout>
                </PlanProtectedRoute>
              } />
              
              <Route path="/dashboard/pro" element={
                <PlanProtectedRoute requiredPlan="pro">
                  <DashboardLayout plan="pro">
                    <ProDashboard />
                  </DashboardLayout>
                </PlanProtectedRoute>
              } />
              
              <Route path="/dashboard/pro/aiseo" element={
                <PlanProtectedRoute requiredPlan="pro">
                  <DashboardLayout plan="pro">
                    <AISEOProtected />
                  </DashboardLayout>
                </PlanProtectedRoute>
              } />
              
              <Route path="/dashboard/enterprise" element={
                <PlanProtectedRoute requiredPlan="enterprise">
                  <DashboardLayout plan="enterprise">
                    <EnterpriseDashboard />
                  </DashboardLayout>
                </PlanProtectedRoute>
              } />
              
              {/* Success/Cancel Pages */}
              <Route path="/dashboard/success" element={<SuccessPage />} />
              <Route path="/dashboard/cancel" element={<Navigate to="/dashboard" replace />} />
              
              {/* Legacy AI SEO route - redirects to new location */}
              <Route path="/ai-seo" element={<Navigate to="/dashboard/pro/aiseo" replace />} />
              
              {/* Kids-AI Routes - Public Access */}
              <Route path="/kids-ai" element={<KidsAIDirectory />} />
              <Route path="/kids-ai/directory" element={<KidsAIDirectory />} />
              <Route path="/kids-ai/apps/story-creator" element={<StoryCreator />} />
              <Route path="/kids-ai/apps/math-wizard" element={<MathWizard />} />
              
              {/* Default redirect - go to login if not authenticated */}
              <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
          </div>
        </Router>
      </UserProvider>
    </StripeProvider>
  );
}

export default App;
