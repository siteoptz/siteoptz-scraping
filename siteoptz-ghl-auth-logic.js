/**
 * GoHighLevel Authentication Logic for SiteOptz.ai
 * 
 * This lightweight module adds GHL conditional logic to your existing
 * login and register forms at siteoptz.ai/#login and /#register
 * 
 * Simply integrate this with your existing authentication handlers
 */

(function(window) {
  'use strict';

  // Configuration
  const GHL_CONFIG = {
    API_URL: 'https://services.leadconnectorhq.com',
    API_KEY: 'pit-8954f181-e668-4613-80d6-c7b4aa8594b8',
    LOCATION_ID: 'ECu5ScdYFmB0WnhvYoBU',
    
    // Your proxy endpoint (to avoid CORS)
    // Update this to your actual proxy URL
    PROXY_URL: 'https://api.siteoptz.ai', // or 'http://localhost:3001' for testing
    
    // Plan tags in GoHighLevel
    PLAN_TAGS: {
      free: 'siteoptz-plan-free',
      starter: 'siteoptz-plan-starter',
      pro: 'siteoptz-plan-pro',
      enterprise: 'siteoptz-plan-enterprise'
    },
    
    // Dashboard URLs
    DASHBOARD_URLS: {
      free: 'https://optz.siteoptz.ai/dashboard/free',
      starter: 'https://optz.siteoptz.ai/dashboard/starter',
      pro: 'https://optz.siteoptz.ai/dashboard/pro',
      enterprise: 'https://optz.siteoptz.ai/dashboard/enterprise'
    }
  };

  /**
   * GoHighLevel Authentication Handler
   */
  const GHLAuth = {
    
    /**
     * Handle login with GHL logic
     * Call this from your existing login form handler
     * 
     * @param {string} email - User's email
     * @param {string} password - User's password
     * @param {function} onSuccess - Callback for successful login
     * @param {function} onError - Callback for errors
     */
    async handleLogin(email, password, onSuccess, onError) {
      try {
        // Check if using proxy or direct API
        const response = await this.callAuthAPI('/auth/login', {
          email: email,
          password: password
        });

        if (response.success) {
          // User authenticated successfully
          const userData = response.user;
          
          // Store user session
          this.storeUserSession(userData);
          
          // Call success callback with user data and dashboard URL
          if (onSuccess) {
            onSuccess({
              user: userData,
              redirectUrl: GHL_CONFIG.DASHBOARD_URLS[userData.plan || 'free'],
              message: 'Login successful'
            });
          }
          
          // Automatic redirect (optional)
          if (GHL_CONFIG.AUTO_REDIRECT !== false) {
            setTimeout(() => {
              window.location.href = GHL_CONFIG.DASHBOARD_URLS[userData.plan || 'free'];
            }, 1500);
          }
          
        } else if (response.error === 'user_not_found') {
          // User doesn't exist - suggest registration
          if (onError) {
            onError({
              type: 'user_not_found',
              message: 'No account found with this email. Please create an account.',
              action: 'redirect_to_register',
              redirectUrl: '#register'
            });
          }
          
        } else if (response.error === 'invalid_password') {
          // Wrong password
          if (onError) {
            onError({
              type: 'invalid_password',
              message: 'Incorrect password. Please try again.'
            });
          }
          
        } else {
          // Other error
          if (onError) {
            onError({
              type: 'login_failed',
              message: response.message || 'Login failed. Please try again.'
            });
          }
        }
        
      } catch (error) {
        console.error('Login error:', error);
        if (onError) {
          onError({
            type: 'network_error',
            message: 'Unable to connect. Please check your connection and try again.'
          });
        }
      }
    },

    /**
     * Handle registration with GHL logic
     * Call this from your existing register form handler
     * 
     * @param {object} userData - User registration data
     * @param {function} onSuccess - Callback for successful registration
     * @param {function} onError - Callback for errors
     */
    async handleRegister(userData, onSuccess, onError) {
      try {
        const { name, email, password, plan = 'free' } = userData;
        
        // Call registration API
        const response = await this.callAuthAPI('/auth/register', {
          name: name,
          email: email,
          password: password,
          plan: plan
        });

        if (response.success) {
          // Registration successful
          const user = response.user;
          
          // Store user session
          this.storeUserSession(user);
          
          // Call success callback
          if (onSuccess) {
            onSuccess({
              user: user,
              redirectUrl: GHL_CONFIG.DASHBOARD_URLS[user.plan],
              message: 'Account created successfully!'
            });
          }
          
          // Automatic redirect (optional)
          if (GHL_CONFIG.AUTO_REDIRECT !== false) {
            setTimeout(() => {
              window.location.href = GHL_CONFIG.DASHBOARD_URLS[user.plan];
            }, 1500);
          }
          
        } else if (response.error === 'user_exists') {
          // User already exists - suggest login
          if (onError) {
            onError({
              type: 'user_exists',
              message: 'An account with this email already exists. Please log in.',
              action: 'redirect_to_login',
              redirectUrl: '#login'
            });
          }
          
        } else {
          // Other error
          if (onError) {
            onError({
              type: 'registration_failed',
              message: response.message || 'Registration failed. Please try again.'
            });
          }
        }
        
      } catch (error) {
        console.error('Registration error:', error);
        if (onError) {
          onError({
            type: 'network_error',
            message: 'Unable to connect. Please check your connection and try again.'
          });
        }
      }
    },

    /**
     * Call authentication API (through proxy to avoid CORS)
     */
    async callAuthAPI(endpoint, data) {
      try {
        const response = await fetch(`${GHL_CONFIG.PROXY_URL}/api${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        
        return await response.json();
        
      } catch (error) {
        console.error('API call error:', error);
        throw error;
      }
    },

    /**
     * Store user session in localStorage
     */
    storeUserSession(userData) {
      localStorage.setItem('siteoptz_user', JSON.stringify({
        id: userData.id,
        email: userData.email,
        name: userData.name,
        plan: userData.plan,
        authenticated: true,
        timestamp: Date.now()
      }));
      
      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('siteoptz:authenticated', {
        detail: { user: userData }
      }));
    },

    /**
     * Get current user from session
     */
    getCurrentUser() {
      try {
        const userData = localStorage.getItem('siteoptz_user');
        return userData ? JSON.parse(userData) : null;
      } catch (error) {
        return null;
      }
    },

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
      const user = this.getCurrentUser();
      return !!(user && user.authenticated);
    },

    /**
     * Logout user
     */
    logout() {
      localStorage.removeItem('siteoptz_user');
      window.dispatchEvent(new CustomEvent('siteoptz:logout'));
    },

    /**
     * Update user plan (for upgrades/downgrades)
     */
    async updateUserPlan(userId, newPlan) {
      try {
        const response = await this.callAuthAPI('/auth/update-plan', {
          userId: userId,
          newPlan: newPlan
        });
        
        if (response.success) {
          // Update local session
          const user = this.getCurrentUser();
          if (user) {
            user.plan = newPlan;
            this.storeUserSession(user);
          }
        }
        
        return response;
        
      } catch (error) {
        console.error('Plan update error:', error);
        throw error;
      }
    }
  };

  // ===================================================================
  // INTEGRATION EXAMPLES - Add these to your existing forms
  // ===================================================================

  /**
   * Example: Integrate with your existing login form
   * 
   * Add this to your current login handler:
   */
  window.handleSiteOptzLogin = function(email, password) {
    // Show loading state
    showLoadingState();
    
    GHLAuth.handleLogin(
      email, 
      password,
      // Success callback
      function(result) {
        hideLoadingState();
        showSuccessMessage(result.message);
        
        // Your existing success logic here
        // The user will be automatically redirected to their dashboard
      },
      // Error callback
      function(error) {
        hideLoadingState();
        
        if (error.type === 'user_not_found') {
          // Show "user not found" message with link to register
          showErrorWithAction(
            error.message,
            'Create Account',
            () => window.location.hash = '#register'
          );
        } else {
          // Show regular error message
          showErrorMessage(error.message);
        }
      }
    );
  };

  /**
   * Example: Integrate with your existing register form
   * 
   * Add this to your current registration handler:
   */
  window.handleSiteOptzRegister = function(name, email, password, plan) {
    // Show loading state
    showLoadingState();
    
    GHLAuth.handleRegister(
      {
        name: name,
        email: email,
        password: password,
        plan: plan || 'free'
      },
      // Success callback
      function(result) {
        hideLoadingState();
        showSuccessMessage(result.message);
        
        // Your existing success logic here
        // The user will be automatically redirected to their dashboard
      },
      // Error callback
      function(error) {
        hideLoadingState();
        
        if (error.type === 'user_exists') {
          // Show "user exists" message with link to login
          showErrorWithAction(
            error.message,
            'Go to Login',
            () => window.location.hash = '#login'
          );
        } else {
          // Show regular error message
          showErrorMessage(error.message);
        }
      }
    );
  };

  // Helper functions (implement these based on your UI)
  function showLoadingState() {
    // Your loading UI logic
    console.log('Loading...');
  }
  
  function hideLoadingState() {
    // Your loading UI logic
    console.log('Loading complete');
  }
  
  function showSuccessMessage(message) {
    // Your success message UI
    console.log('Success:', message);
  }
  
  function showErrorMessage(message) {
    // Your error message UI
    console.log('Error:', message);
  }
  
  function showErrorWithAction(message, actionText, actionCallback) {
    // Your error with action button UI
    console.log('Error:', message, '- Action:', actionText);
    // Add button that calls actionCallback when clicked
  }

  // ===================================================================
  // JQUERY INTEGRATION EXAMPLE (if you're using jQuery)
  // ===================================================================
  
  if (typeof jQuery !== 'undefined') {
    jQuery(document).ready(function($) {
      
      // Login form handler
      $('#login-form').on('submit', function(e) {
        e.preventDefault();
        
        const email = $('#email').val();
        const password = $('#password').val();
        
        GHLAuth.handleLogin(email, password,
          function(result) {
            // Success
            $('.error-message').hide();
            $('.success-message').text(result.message).show();
          },
          function(error) {
            // Error
            $('.success-message').hide();
            $('.error-message').text(error.message).show();
            
            if (error.action === 'redirect_to_register') {
              $('.error-action').html(
                '<a href="#register">Create Account</a>'
              ).show();
            }
          }
        );
      });
      
      // Register form handler
      $('#register-form').on('submit', function(e) {
        e.preventDefault();
        
        const userData = {
          name: $('#name').val(),
          email: $('#email').val(),
          password: $('#password').val(),
          plan: $('#plan').val() || 'free'
        };
        
        GHLAuth.handleRegister(userData,
          function(result) {
            // Success
            $('.error-message').hide();
            $('.success-message').text(result.message).show();
          },
          function(error) {
            // Error
            $('.success-message').hide();
            $('.error-message').text(error.message).show();
            
            if (error.action === 'redirect_to_login') {
              $('.error-action').html(
                '<a href="#login">Go to Login</a>'
              ).show();
            }
          }
        );
      });
      
    });
  }

  // Expose the API globally
  window.SiteOptzGHLAuth = GHLAuth;
  
  // Also expose configuration for customization
  window.SiteOptzGHLConfig = GHL_CONFIG;

})(window);