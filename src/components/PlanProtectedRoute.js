// Plan Protected Route Component
// Verifies user has access to the required plan level

import React from 'react';
import { Navigate } from 'react-router-dom';
import GHLAuthService from '../services/GHLAuthService';

const PlanProtectedRoute = ({ children, requiredPlan }) => {
  // Check if user is authenticated
  if (!GHLAuthService.isAuthenticated()) {
    console.log('❌ User not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Get current user
  const user = GHLAuthService.getCurrentUser();
  
  if (!user) {
    console.log('❌ No user data found, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Check if user has access to this plan
  const hasAccess = GHLAuthService.hasAccessToPlan(user.plan, requiredPlan);

  if (!hasAccess) {
    console.log(`❌ User plan "${user.plan}" does not have access to "${requiredPlan}"`);
    // Redirect to user's actual dashboard
    return <Navigate to={`/dashboard/${user.plan}`} replace />;
  }

  console.log(`✅ Access granted to ${requiredPlan} dashboard`);
  return children;
};

export default PlanProtectedRoute;
