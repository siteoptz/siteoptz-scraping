import React, { createContext, useContext, useState, useEffect } from 'react';
import AuthenticationService from '../services/AuthenticationService';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [currentPlan, setCurrentPlan] = useState('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user from session or SSO token
    const loadUser = async () => {
      try {
        // First check for existing session
        const sessionUser = AuthenticationService.getCurrentUser();
        
        if (sessionUser) {
          // Verify user is still valid in GHL
          try {
            const verification = await AuthenticationService.verifyUserInGHL(sessionUser.email);
            if (verification.exists) {
              setUser(verification.user);
              setCurrentPlan(verification.user.plan);
              AuthenticationService.storeUserSession(verification.user);
            } else {
              // User no longer exists - clear session
              AuthenticationService.clearUserSession();
              setUser(null);
              setCurrentPlan('free');
            }
          } catch (error) {
            console.error('User verification failed:', error);
            // Use cached data if verification fails
            setUser(sessionUser);
            setCurrentPlan(sessionUser.plan);
          }
        } else {
          // Check URL for SSO token (OAuth callback or GHL redirect)
          const urlParams = new URLSearchParams(window.location.search);
          const ssoToken = urlParams.get('sso_token');
          
          if (ssoToken) {
            try {
              // Decode the SSO token to get user info
              const tokenData = JSON.parse(atob(ssoToken));
              
              // Verify user in GHL
              const verification = await AuthenticationService.verifyUserInGHL(tokenData.email);
              
              if (verification.exists) {
                setUser(verification.user);
                setCurrentPlan(verification.user.plan);
                AuthenticationService.storeUserSession(verification.user);
              }
            } catch (e) {
              console.log('Could not parse SSO token:', e);
            }
          }
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();

    // Listen for authentication events
    const handleUserAuthenticated = (event) => {
      const userData = event.detail;
      setUser(userData);
      setCurrentPlan(userData.plan);
    };

    const handleUserLoggedOut = () => {
      setUser(null);
      setCurrentPlan('free');
    };

    window.addEventListener('userAuthenticated', handleUserAuthenticated);
    window.addEventListener('userLoggedOut', handleUserLoggedOut);

    return () => {
      window.removeEventListener('userAuthenticated', handleUserAuthenticated);
      window.removeEventListener('userLoggedOut', handleUserLoggedOut);
    };
  }, []);

  const upgradePlan = async (newPlan) => {
    try {
      setCurrentPlan(newPlan);
      // Update user plan in backend
      if (user) {
        setUser({ ...user, plan: newPlan });
      }
    } catch (error) {
      console.error('Error upgrading plan:', error);
      throw error;
    }
  };

  const value = {
    user,
    currentPlan,
    loading,
    upgradePlan,
    setCurrentPlan
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
