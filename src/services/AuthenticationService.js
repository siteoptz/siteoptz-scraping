/**
 * Authentication Service for SiteOptz
 * Handles user authentication, verification with Go High Level,
 * and proper routing based on user status and subscription plan
 */

class AuthenticationService {
  constructor() {
    this.ghlApiUrl = process.env.REACT_APP_GHL_API_URL;
    this.ghlApiKey = process.env.REACT_APP_GHL_API_KEY;
    this.ghlLocationId = process.env.REACT_APP_GHL_LOCATION_ID;
  }

  /**
   * Verify if a user exists in Go High Level
   * @param {string} email - User's email address
   * @returns {Promise<{exists: boolean, user: object|null}>}
   */
  async verifyUserInGHL(email) {
    try {
      const response = await fetch(`${this.ghlApiUrl}/contacts/lookup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.ghlApiKey}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        },
        body: JSON.stringify({
          email: email,
          locationId: this.ghlLocationId
        })
      });

      if (response.status === 404) {
        return { exists: false, user: null };
      }

      if (!response.ok) {
        throw new Error(`GHL verification failed: ${response.statusText}`);
      }

      const data = await response.json();
      const contact = data.contact || data.contacts?.[0];
      
      if (!contact) {
        return { exists: false, user: null };
      }

      // Extract plan from tags or custom fields
      const plan = this.extractPlanFromContact(contact);
      
      return {
        exists: true,
        user: {
          id: contact.id,
          email: contact.email,
          name: contact.name || `${contact.firstName} ${contact.lastName}`,
          plan: plan,
          tags: contact.tags || [],
          customFields: contact.customFields || {},
          ghlContactId: contact.id
        }
      };
    } catch (error) {
      console.error('GHL verification error:', error);
      throw new Error('Unable to verify user status. Please try again.');
    }
  }

  /**
   * Extract subscription plan from GHL contact data
   * @param {object} contact - GHL contact object
   * @returns {string} - User's plan (free, starter, pro, enterprise)
   */
  extractPlanFromContact(contact) {
    const tags = contact.tags || [];
    const customFields = contact.customFields || {};
    
    // Check tags first
    const planTags = {
      'enterprise-plan': 'enterprise',
      'pro-plan': 'pro',
      'starter-plan': 'starter',
      'free-plan': 'free',
      'tier-enterprise': 'enterprise',
      'tier-pro': 'pro',
      'tier-starter': 'starter',
      'tier-free': 'free'
    };

    for (const tag of tags) {
      const planFromTag = planTags[tag.toLowerCase()];
      if (planFromTag) {
        return planFromTag;
      }
    }

    // Check custom fields
    if (customFields.subscription_plan) {
      return customFields.subscription_plan.toLowerCase();
    }

    // Default to free plan if no plan information found
    return 'free';
  }

  /**
   * Handle login attempt for existing users
   * @param {string} email - User's email
   * @param {string} password - User's password (optional for OAuth)
   * @param {string} authMethod - 'email' or 'oauth'
   * @returns {Promise<{success: boolean, message: string, redirect: string}>}
   */
  async handleLogin(email, password = null, authMethod = 'email') {
    try {
      // Verify user exists in GHL
      const verification = await this.verifyUserInGHL(email);
      
      if (!verification.exists) {
        // User not found - redirect to Get Started
        return {
          success: false,
          message: 'User Not Found. Please use the Get Started option to create an account.',
          redirect: '/get-started',
          action: 'REDIRECT_TO_SIGNUP'
        };
      }

      // User exists - authenticate and get their plan
      const user = verification.user;
      
      // Store user data in context/localStorage
      this.storeUserSession(user);
      
      // Determine dashboard based on plan
      const dashboardRoute = `/dashboard/${user.plan}`;
      
      return {
        success: true,
        message: 'Login successful',
        redirect: dashboardRoute,
        user: user
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.message || 'Login failed. Please try again.',
        redirect: null
      };
    }
  }

  /**
   * Handle signup/get started for new users
   * @param {object} userData - User registration data
   * @returns {Promise<{success: boolean, message: string, redirect: string}>}
   */
  async handleGetStarted(userData) {
    try {
      const { email, name, password, authMethod = 'email' } = userData;
      
      // First check if user already exists
      const verification = await this.verifyUserInGHL(email);
      
      if (verification.exists) {
        // User already exists - redirect to login
        return {
          success: false,
          message: 'Existing User. An account with this email already exists. Please use the Log In option instead.',
          redirect: '/login',
          action: 'REDIRECT_TO_LOGIN'
        };
      }

      // Create new user in GHL
      const newUser = await this.createUserInGHL({
        email,
        name,
        plan: 'free', // New users start with free plan
        authMethod
      });

      // Store user session
      this.storeUserSession(newUser);
      
      // New users go to free dashboard
      return {
        success: true,
        message: 'Account created successfully',
        redirect: '/dashboard/free',
        user: newUser
      };
    } catch (error) {
      console.error('Get Started error:', error);
      return {
        success: false,
        message: error.message || 'Registration failed. Please try again.',
        redirect: null
      };
    }
  }

  /**
   * Create a new user in Go High Level
   * @param {object} userData - User data to create
   * @returns {Promise<object>} - Created user object
   */
  async createUserInGHL(userData) {
    try {
      const { email, name, plan = 'free', authMethod } = userData;
      
      const response = await fetch(`${this.ghlApiUrl}/contacts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.ghlApiKey}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        },
        body: JSON.stringify({
          email: email,
          name: name,
          locationId: this.ghlLocationId,
          tags: [`${plan}-plan`, 'siteoptz-user', `auth-${authMethod}`],
          customFields: {
            subscription_plan: plan,
            registration_date: new Date().toISOString(),
            auth_method: authMethod
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create user: ${response.statusText}`);
      }

      const createdContact = await response.json();
      
      return {
        id: createdContact.contact.id,
        email: createdContact.contact.email,
        name: createdContact.contact.name,
        plan: plan,
        ghlContactId: createdContact.contact.id
      };
    } catch (error) {
      console.error('GHL user creation error:', error);
      throw new Error('Unable to create account. Please try again.');
    }
  }

  /**
   * Verify user has access to a specific plan/dashboard
   * Prevents users from bypassing their plan by changing URLs
   * @param {string} userPlan - User's current plan
   * @param {string} requestedPlan - Plan they're trying to access
   * @returns {boolean} - Whether access is allowed
   */
  verifyPlanAccess(userPlan, requestedPlan) {
    const planHierarchy = {
      'free': 0,
      'starter': 1,
      'pro': 2,
      'enterprise': 3
    };

    const userLevel = planHierarchy[userPlan] || 0;
    const requestedLevel = planHierarchy[requestedPlan] || 0;

    // User can only access their plan level or lower
    return userLevel >= requestedLevel;
  }

  /**
   * Get appropriate dashboard route for user
   * @param {object} user - User object with plan information
   * @returns {string} - Dashboard route
   */
  getDashboardRoute(user) {
    if (!user || !user.plan) {
      return '/dashboard/free';
    }

    // Ensure user can't access higher plans
    const validPlans = ['free', 'starter', 'pro', 'enterprise'];
    const userPlan = validPlans.includes(user.plan) ? user.plan : 'free';
    
    return `/dashboard/${userPlan}`;
  }

  /**
   * Store user session data
   * @param {object} user - User data to store
   */
  storeUserSession(user) {
    // Store in localStorage for persistence
    localStorage.setItem('userPlan', user.plan);
    localStorage.setItem('userEmail', user.email);
    localStorage.setItem('userId', user.id);
    localStorage.setItem('userName', user.name);
    localStorage.setItem('ghlContactId', user.ghlContactId);
    
    // Create SSO token for Cyfe dashboards
    const ssoToken = this.generateSSOToken(user);
    localStorage.setItem('ssoToken', ssoToken);
    
    // Trigger event for UserContext to update
    window.dispatchEvent(new CustomEvent('userAuthenticated', { 
      detail: user 
    }));
  }

  /**
   * Generate SSO token for authenticated user
   * @param {object} user - User object
   * @returns {string} - SSO token
   */
  generateSSOToken(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      timestamp: Date.now(),
      expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };
    
    return btoa(JSON.stringify(payload));
  }

  /**
   * Clear user session (logout)
   */
  clearUserSession() {
    localStorage.removeItem('userPlan');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('ghlContactId');
    localStorage.removeItem('ssoToken');
    
    window.dispatchEvent(new CustomEvent('userLoggedOut'));
  }

  /**
   * Get current user from session
   * @returns {object|null} - Current user or null if not authenticated
   */
  getCurrentUser() {
    const userId = localStorage.getItem('userId');
    if (!userId) return null;
    
    return {
      id: userId,
      email: localStorage.getItem('userEmail'),
      name: localStorage.getItem('userName'),
      plan: localStorage.getItem('userPlan') || 'free',
      ghlContactId: localStorage.getItem('ghlContactId')
    };
  }

  /**
   * Handle OAuth callback
   * @param {string} provider - OAuth provider (google, github, etc.)
   * @param {object} authData - OAuth response data
   * @returns {Promise<{success: boolean, redirect: string}>}
   */
  async handleOAuthCallback(provider, authData) {
    try {
      const { email, name, id: providerId } = authData;
      
      // Check if user exists
      const verification = await this.verifyUserInGHL(email);
      
      if (verification.exists) {
        // Existing user - log them in
        this.storeUserSession(verification.user);
        return {
          success: true,
          redirect: this.getDashboardRoute(verification.user)
        };
      } else {
        // New user - create account
        const newUser = await this.createUserInGHL({
          email,
          name,
          plan: 'free',
          authMethod: `oauth-${provider}`
        });
        
        this.storeUserSession(newUser);
        return {
          success: true,
          redirect: '/dashboard/free'
        };
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      return {
        success: false,
        redirect: '/login?error=oauth_failed'
      };
    }
  }
}

export default new AuthenticationService();