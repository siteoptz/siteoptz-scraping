import React, { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import AuthenticationService from '../services/AuthenticationService';
import { useUser } from '../contexts/UserContext';
import './PlanProtectedRoute.css';

/**
 * Protected Route Component
 * Ensures users can only access dashboards appropriate for their subscription plan
 * Prevents users from bypassing their plan by manually changing URLs
 */
const PlanProtectedRoute = ({ children, requiredPlan }) => {
  const { user, currentPlan, loading: userLoading } = useUser();
  const [isVerifying, setIsVerifying] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [verificationError, setVerificationError] = useState(null);
  const params = useParams();

  useEffect(() => {
    verifyAccess();
  }, [user, currentPlan, requiredPlan]);

  const verifyAccess = async () => {
    try {
      setIsVerifying(true);
      setVerificationError(null);

      // Wait for user context to load
      if (userLoading) {
        return;
      }

      // Check if user is authenticated
      const currentUser = AuthenticationService.getCurrentUser();
      if (!currentUser) {
        setHasAccess(false);
        setVerificationError('Not authenticated');
        return;
      }

      // Verify with GHL for real-time plan status
      const verification = await AuthenticationService.verifyUserInGHL(currentUser.email);
      
      if (!verification.exists) {
        // User no longer exists in GHL
        AuthenticationService.clearUserSession();
        setHasAccess(false);
        setVerificationError('User verification failed');
        return;
      }

      // Update user plan if it changed in GHL
      const ghlPlan = verification.user.plan;
      if (ghlPlan !== currentPlan) {
        // Plan has changed in GHL - update local state
        AuthenticationService.storeUserSession(verification.user);
      }

      // Check if user has access to the requested plan
      const canAccess = AuthenticationService.verifyPlanAccess(ghlPlan, requiredPlan);
      setHasAccess(canAccess);

      if (!canAccess) {
        setVerificationError(`This dashboard requires ${requiredPlan} plan or higher`);
      }
    } catch (error) {
      console.error('Access verification failed:', error);
      setVerificationError('Unable to verify access. Please try again.');
      setHasAccess(false);
    } finally {
      setIsVerifying(false);
    }
  };

  // Show loading while verifying
  if (userLoading || isVerifying) {
    return (
      <div className="plan-protected-loading">
        <div className="loading-spinner"></div>
        <h3>Verifying Access...</h3>
        <p>Please wait while we verify your subscription status.</p>
      </div>
    );
  }

  // No user - redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // User doesn't have access to this plan
  if (!hasAccess) {
    const userPlan = currentPlan || 'free';
    const correctDashboard = `/dashboard/${userPlan}`;
    
    return (
      <div className="plan-protected-denied">
        <div className="denied-container">
          <div className="denied-icon">🔒</div>
          <h2>Access Restricted</h2>
          <p className="error-message">{verificationError}</p>
          
          <div className="plan-info">
            <div className="current-plan">
              <span className="label">Your Current Plan:</span>
              <span className="plan-badge">{userPlan.toUpperCase()}</span>
            </div>
            <div className="required-plan">
              <span className="label">Required Plan:</span>
              <span className="plan-badge required">{requiredPlan.toUpperCase()}</span>
            </div>
          </div>

          <div className="action-buttons">
            <button 
              className="btn-dashboard"
              onClick={() => window.location.href = correctDashboard}
            >
              Go to Your Dashboard
            </button>
            
            {userPlan !== 'enterprise' && (
              <button 
                className="btn-upgrade"
                onClick={() => window.location.href = `${correctDashboard}#upgrade`}
              >
                Upgrade Plan
              </button>
            )}
          </div>

          <div className="upgrade-benefits">
            <h4>Upgrade to {requiredPlan} to get:</h4>
            {renderPlanBenefits(requiredPlan)}
          </div>
        </div>
      </div>
    );
  }

  // User has access - render children
  return <>{children}</>;
};

/**
 * Render plan benefits based on the plan
 */
const renderPlanBenefits = (plan) => {
  const benefits = {
    starter: (
      <ul>
        <li>✓ Advanced Analytics Dashboard</li>
        <li>✓ Real-time Performance Monitoring</li>
        <li>✓ Up to 10 websites</li>
        <li>✓ Priority email support</li>
        <li>✓ Monthly SEO reports</li>
      </ul>
    ),
    pro: (
      <ul>
        <li>✓ AI-Powered SEO Optimization</li>
        <li>✓ Hail Storm Campaign Manager</li>
        <li>✓ Unlimited websites</li>
        <li>✓ API access</li>
        <li>✓ 24/7 Priority support</li>
        <li>✓ Custom integrations</li>
      </ul>
    ),
    enterprise: (
      <ul>
        <li>✓ Everything in Pro</li>
        <li>✓ Dedicated account manager</li>
        <li>✓ Custom dashboards</li>
        <li>✓ White-label options</li>
        <li>✓ SLA guarantee</li>
        <li>✓ Advanced API limits</li>
      </ul>
    )
  };

  return benefits[plan] || null;
};

export default PlanProtectedRoute;