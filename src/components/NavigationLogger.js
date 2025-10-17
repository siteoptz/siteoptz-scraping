// Navigation Logger Component
// Logs route changes for debugging (development only)

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const NavigationLogger = () => {
  const location = useLocation();

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('📍 Route changed to:', location.pathname);
      console.log('🔍 Location state:', location.state);
    }
  }, [location]);

  return null; // This component doesn't render anything
};

export default NavigationLogger;
