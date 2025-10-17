// AI SEO Protected Component
// Wrapper to ensure only Pro and Enterprise users can access AI SEO

import React from 'react';
import { Navigate } from 'react-router-dom';
import GHLAuthService from '../services/GHLAuthService';
import AISEODashboard from './AISEODashboard';

const AISEOProtected = () => {
  const user = GHLAuthService.getCurrentUser();
  
  // AI SEO is only available for Pro and Enterprise plans
  const allowedPlans = ['pro', 'enterprise'];
  
  if (!user || !allowedPlans.includes(user.plan)) {
    console.log(`❌ AI SEO not available for plan: ${user?.plan}`);
    return (
      <div className="feature-locked">
        <h2>🔒 AI SEO Service</h2>
        <p>This feature is available on Pro and Enterprise plans.</p>
        <button onClick={() => window.location.href = '/dashboard/pricing'}>
          Upgrade to Pro
        </button>
      </div>
    );
  }

  return <AISEODashboard />;
};

export default AISEOProtected;
