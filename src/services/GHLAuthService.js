// GoHighLevel Authentication Service
// Handles OAuth, email login, and plan verification via GHL tags

import axios from 'axios';

class GHLAuthService {
  constructor() {
    this.apiKey = process.env.REACT_APP_GHL_API_KEY;
    this.locationId = process.env.REACT_APP_GHL_LOCATION_ID;
    this.baseUrl = 'https://services.leadconnectorhq.com';
    
    // Plan tag names in GoHighLevel
    this.planTags = {
      free: 'siteoptz-plan-free',
      starter: 'siteoptz-plan-starter',
      pro: 'siteoptz-plan-pro',
      enterprise: 'siteoptz-plan-enterprise'
    };
  }

  /**
   * Initialize OAuth flow with GoHighLevel
   */
  async initiateOAuth() {
    const clientId = process.env.REACT_APP_GHL_OAUTH_CLIENT_ID;
    const redirectUri = process.env.REACT_APP_GHL_OAUTH_REDIRECT_URI || `${window.location.origin}/auth/callback`;
    const scope = 'contacts.readonly contacts.write';
    
    const authUrl = `https://marketplace.gohighlevel.com/oauth/chooselocation?` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `client_id=${clientId}&` +
      `scope=${encodeURIComponent(scope)}`;
    
    // Store the current path to redirect back after auth
    localStorage.setItem('auth_redirect', window.location.pathname);
    
    window.location.href = authUrl;
  }

  /**
   * Handle OAuth callback and exchange code for access token
   */
  async handleOAuthCallback(code) {
    try {
      const response = await axios.post(`${window.location.origin}/api/auth/ghl/callback`, {
        code,
        redirect_uri: process.env.REACT_APP_GHL_OAUTH_REDIRECT_URI || `${window.location.origin}/auth/callback`
      });

      const { access_token, contact } = response.data;

      // Store auth token
      localStorage.setItem('ghl_access_token', access_token);

      // Get user plan from contact tags
      const plan = this.extractPlanFromContact(contact);

      // Store user info
      const userData = {
        id: contact.id,
        email: contact.email,
        name: contact.firstName + ' ' + contact.lastName,
        plan: plan,
        tags: contact.tags || [],
        authenticated: true
      };

      localStorage.setItem('user_data', JSON.stringify(userData));

      return userData;

    } catch (error) {
      console.error('OAuth callback error:', error);
      throw new Error('Failed to authenticate with GoHighLevel');
    }
  }

  /**
   * Email/Password Login - Check if user exists in GHL by email
   */
  async loginWithEmail(email, password) {
    try {
      console.log('🔐 Attempting login for:', email);

      // Step 1: Check if contact exists in GoHighLevel
      const contact = await this.findContactByEmail(email);

      if (!contact) {
        // User not found - direct to Get Started
        return {
          success: false,
          error: 'user_not_found',
          message: 'No account found with this email address. Please create an account using Get Started.',
          redirectTo: '/get-started'
        };
      }

      // Step 2: Verify password (if you're storing custom field in GHL)
      // Note: GHL doesn't natively handle passwords, so you'll need to:
      // Option A: Store password hash in a custom field
      // Option B: Use external auth service (Firebase, Auth0)
      // Option C: Send magic link via email
      
      const passwordValid = await this.verifyPassword(contact, password);

      if (!passwordValid) {
        return {
          success: false,
          error: 'invalid_password',
          message: 'Incorrect password. Please try again.'
        };
      }

      // Step 3: Get user's plan from tags
      const plan = this.extractPlanFromContact(contact);

      if (!plan) {
        // No plan assigned - default to free
        await this.assignPlanTag(contact.id, 'free');
      }

      // Step 4: Create user session
      const userData = {
        id: contact.id,
        email: contact.email,
        name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
        plan: plan || 'free',
        tags: contact.tags || [],
        authenticated: true,
        loginMethod: 'email'
      };

      localStorage.setItem('user_data', JSON.stringify(userData));
      localStorage.setItem('auth_token', Date.now().toString()); // Simple token

      console.log('✅ Login successful:', userData);

      return {
        success: true,
        user: userData,
        redirectTo: `/dashboard/${userData.plan}`
      };

    } catch (error) {
      console.error('❌ Login error:', error);
      return {
        success: false,
        error: 'login_failed',
        message: 'Login failed. Please try again.'
      };
    }
  }

  /**
   * Sign Up / Get Started - Create new user in GHL
   */
  async signUpWithEmail(email, password, name, plan = 'free') {
    try {
      console.log('📝 Creating new account for:', email);

      // Step 1: Check if user already exists
      const existingContact = await this.findContactByEmail(email);

      if (existingContact) {
        // User already exists - direct to login
        return {
          success: false,
          error: 'user_exists',
          message: 'An account with this email already exists. Please log in instead.',
          redirectTo: '/login'
        };
      }

      // Step 2: Create new contact in GoHighLevel
      const newContact = await this.createContact({
        email,
        firstName: name.split(' ')[0] || name,
        lastName: name.split(' ').slice(1).join(' ') || '',
        tags: [this.planTags[plan]]
      });

      // Step 3: Store password (hash it first!)
      await this.storePasswordForContact(newContact.id, password);

      // Step 4: Create user session
      const userData = {
        id: newContact.id,
        email: newContact.email,
        name: name,
        plan: plan,
        tags: [this.planTags[plan]],
        authenticated: true,
        loginMethod: 'email',
        isNewUser: true
      };

      localStorage.setItem('user_data', JSON.stringify(userData));
      localStorage.setItem('auth_token', Date.now().toString());

      console.log('✅ Account created successfully:', userData);

      return {
        success: true,
        user: userData,
        redirectTo: `/dashboard/${plan}`
      };

    } catch (error) {
      console.error('❌ Sign up error:', error);
      return {
        success: false,
        error: 'signup_failed',
        message: 'Failed to create account. Please try again.'
      };
    }
  }

  /**
   * Find contact by email in GoHighLevel
   */
  async findContactByEmail(email) {
    try {
      const response = await axios.get(`${this.baseUrl}/contacts/`, {
        params: {
          query: email,
          locationId: this.locationId
        },
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        }
      });

      if (response.data.contacts && response.data.contacts.length > 0) {
        return response.data.contacts[0];
      }

      return null;

    } catch (error) {
      console.error('Error finding contact:', error);
      return null;
    }
  }

  /**
   * Create new contact in GoHighLevel
   */
  async createContact(contactData) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/contacts/`,
        {
          ...contactData,
          locationId: this.locationId
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28'
          }
        }
      );

      return response.data.contact;

    } catch (error) {
      console.error('Error creating contact:', error);
      throw error;
    }
  }

  /**
   * Assign plan tag to contact
   */
  async assignPlanTag(contactId, plan) {
    try {
      const tag = this.planTags[plan];
      
      // Remove all other plan tags first
      await this.removeAllPlanTags(contactId);

      // Add the new plan tag
      await axios.post(
        `${this.baseUrl}/contacts/${contactId}/tags`,
        {
          tags: [tag]
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28'
          }
        }
      );

      console.log(`✅ Assigned ${plan} plan to contact ${contactId}`);
      return true;

    } catch (error) {
      console.error('Error assigning plan tag:', error);
      return false;
    }
  }

  /**
   * Remove all plan tags from contact
   */
  async removeAllPlanTags(contactId) {
    try {
      const planTagsList = Object.values(this.planTags);
      
      await axios.delete(
        `${this.baseUrl}/contacts/${contactId}/tags`,
        {
          data: {
            tags: planTagsList
          },
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28'
          }
        }
      );

      return true;

    } catch (error) {
      console.error('Error removing plan tags:', error);
      return false;
    }
  }

  /**
   * Extract plan from contact tags
   */
  extractPlanFromContact(contact) {
    if (!contact || !contact.tags) return null;

    const tags = Array.isArray(contact.tags) ? contact.tags : [];
    
    // Check which plan tag the user has
    for (const [plan, tag] of Object.entries(this.planTags)) {
      if (tags.includes(tag)) {
        return plan;
      }
    }

    return null; // No plan tag found
  }

  /**
   * Verify password for contact
   * Note: This is a placeholder - implement based on your password storage method
   */
  async verifyPassword(contact, password) {
    try {
      // Option 1: If using custom field in GHL
      const storedHash = contact.customFields?.password_hash;
      if (storedHash) {
        return await this.comparePasswords(password, storedHash);
      }

      // Option 2: If using external auth service
      // return await externalAuthService.verify(contact.email, password);

      // Option 3: For development/testing - just check if password exists
      // REMOVE THIS IN PRODUCTION!
      if (process.env.NODE_ENV === 'development') {
        return password.length >= 6; // Simple check for dev
      }

      return false;

    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  }

  /**
   * Store password for contact
   * Note: Always hash passwords before storing!
   */
  async storePasswordForContact(contactId, password) {
    try {
      // Hash the password
      const passwordHash = await this.hashPassword(password);

      // Store in GHL custom field
      await axios.put(
        `${this.baseUrl}/contacts/${contactId}`,
        {
          customFields: {
            password_hash: passwordHash
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28'
          }
        }
      );

      return true;

    } catch (error) {
      console.error('Error storing password:', error);
      return false;
    }
  }

  /**
   * Hash password (simple implementation - use bcrypt in production)
   */
  async hashPassword(password) {
    // In production, use bcrypt or similar
    // This is a simple example using Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  /**
   * Compare passwords
   */
  async comparePasswords(password, hash) {
    const inputHash = await this.hashPassword(password);
    return inputHash === hash;
  }

  /**
   * Get current user from localStorage
   */
  getCurrentUser() {
    try {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        return JSON.parse(userData);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    const user = this.getCurrentUser();
    const token = localStorage.getItem('auth_token');
    return !!(user && token);
  }

  /**
   * Logout user
   */
  logout() {
    localStorage.removeItem('user_data');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('ghl_access_token');
    console.log('👋 User logged out');
  }

  /**
   * Update user plan (when they upgrade/downgrade)
   */
  async updateUserPlan(newPlan) {
    try {
      const user = this.getCurrentUser();
      if (!user) return false;

      // Update tag in GoHighLevel
      await this.assignPlanTag(user.id, newPlan);

      // Update local storage
      user.plan = newPlan;
      user.tags = [this.planTags[newPlan]];
      localStorage.setItem('user_data', JSON.stringify(user));

      console.log(`✅ Updated user plan to: ${newPlan}`);
      return true;

    } catch (error) {
      console.error('Error updating user plan:', error);
      return false;
    }
  }

  /**
   * Check if user has access to a specific plan
   */
  hasAccessToPlan(userPlan, requiredPlan) {
    const planHierarchy = {
      'free': 1,
      'starter': 2,
      'pro': 3,
      'enterprise': 4
    };

    const userLevel = planHierarchy[userPlan] || 0;
    const requiredLevel = planHierarchy[requiredPlan] || 0;

    return userLevel >= requiredLevel;
  }

  /**
   * Send magic link for passwordless login (alternative method)
   */
  async sendMagicLink(email) {
    try {
      const contact = await this.findContactByEmail(email);
      
      if (!contact) {
        return {
          success: false,
          error: 'user_not_found',
          message: 'No account found with this email.'
        };
      }

      // Generate magic link token
      const token = this.generateMagicToken(contact.id);
      const magicLink = `${window.location.origin}/auth/magic?token=${token}`;

      // Send email via GHL
      // You would implement this using GHL's email API or workflow

      return {
        success: true,
        message: 'Magic link sent to your email!'
      };

    } catch (error) {
      console.error('Error sending magic link:', error);
      return {
        success: false,
        error: 'send_failed',
        message: 'Failed to send magic link.'
      };
    }
  }

  /**
   * Generate magic link token
   */
  generateMagicToken(contactId) {
    const payload = {
      id: contactId,
      timestamp: Date.now(),
      expires: Date.now() + (15 * 60 * 1000) // 15 minutes
    };
    return btoa(JSON.stringify(payload));
  }

  /**
   * Verify magic link token
   */
  async verifyMagicToken(token) {
    try {
      const payload = JSON.parse(atob(token));
      
      // Check if expired
      if (Date.now() > payload.expires) {
        return { valid: false, error: 'Token expired' };
      }

      // Get contact from GHL
      const response = await axios.get(
        `${this.baseUrl}/contacts/${payload.id}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Version': '2021-07-28'
          }
        }
      );

      const contact = response.data.contact;
      const plan = this.extractPlanFromContact(contact);

      return {
        valid: true,
        contact,
        plan
      };

    } catch (error) {
      console.error('Error verifying magic token:', error);
      return { valid: false, error: 'Invalid token' };
    }
  }
}

export default new GHLAuthService();

