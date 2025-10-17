/**
 * SiteOptz.ai Authentication Integration
 * 
 * This script integrates GoHighLevel authentication with siteoptz.ai
 * using hash-based routing (/#login and /#register)
 * 
 * Add this script to your siteoptz.ai website to enable authentication
 */

(function() {
  'use strict';

  // Configuration - Update these with your actual values
  const CONFIG = {
    GHL_API_KEY: 'pit-8954f181-e668-4613-80d6-c7b4aa8594b8',
    GHL_LOCATION_ID: 'ECu5ScdYFmB0WnhvYoBU',
    GHL_BASE_URL: 'https://services.leadconnectorhq.com',
    DASHBOARD_BASE_URL: 'https://optz.siteoptz.ai/dashboard', // Update with your dashboard URL
    
    // Plan tags in GoHighLevel
    PLAN_TAGS: {
      free: 'siteoptz-plan-free',
      starter: 'siteoptz-plan-starter',
      pro: 'siteoptz-plan-pro',
      enterprise: 'siteoptz-plan-enterprise'
    }
  };

  /**
   * Authentication Service
   */
  class SiteOptzAuth {
    constructor() {
      this.currentUser = this.loadUserFromStorage();
      this.initializeRouting();
    }

    /**
     * Initialize hash-based routing
     */
    initializeRouting() {
      // Listen for hash changes
      window.addEventListener('hashchange', () => this.handleRoute());
      
      // Handle initial route
      this.handleRoute();
    }

    /**
     * Handle routing based on hash
     */
    handleRoute() {
      const hash = window.location.hash;
      
      switch(hash) {
        case '#login':
        case '#/login':
          this.showLoginForm();
          break;
        case '#register':
        case '#/register':
          this.showRegisterForm();
          break;
        case '#logout':
        case '#/logout':
          this.logout();
          break;
        default:
          // Check if user is trying to access protected content
          if (hash.startsWith('#dashboard') || hash.startsWith('#/dashboard')) {
            this.checkAuthentication();
          }
      }
    }

    /**
     * Show login form
     */
    showLoginForm() {
      const formHTML = `
        <div id="auth-modal" class="auth-modal">
          <div class="auth-container">
            <div class="auth-card">
              <button class="close-btn" onclick="window.location.hash=''">&times;</button>
              
              <h2>Welcome Back</h2>
              <p>Sign in to access your dashboard</p>
              
              <div id="auth-message"></div>
              
              <form id="login-form">
                <div class="form-group">
                  <label>Email Address</label>
                  <input type="email" id="login-email" required placeholder="you@example.com">
                </div>
                
                <div class="form-group">
                  <label>Password</label>
                  <input type="password" id="login-password" required placeholder="Enter your password">
                </div>
                
                <button type="submit" class="btn-primary">Sign In</button>
              </form>
              
              <div class="auth-footer">
                <p>Don't have an account? <a href="#register">Create Account</a></p>
              </div>
            </div>
          </div>
        </div>
      `;
      
      this.renderAuthForm(formHTML);
      this.attachLoginHandlers();
    }

    /**
     * Show register form
     */
    showRegisterForm() {
      const formHTML = `
        <div id="auth-modal" class="auth-modal">
          <div class="auth-container">
            <div class="auth-card">
              <button class="close-btn" onclick="window.location.hash=''">&times;</button>
              
              <h2>Get Started with SiteOptz.ai</h2>
              <p>Create your account and start scaling with AI</p>
              
              <div id="auth-message"></div>
              
              <form id="register-form">
                <div class="form-group">
                  <label>Full Name</label>
                  <input type="text" id="register-name" required placeholder="John Doe">
                </div>
                
                <div class="form-group">
                  <label>Email Address</label>
                  <input type="email" id="register-email" required placeholder="you@example.com">
                </div>
                
                <div class="form-group">
                  <label>Password</label>
                  <input type="password" id="register-password" required placeholder="At least 6 characters">
                </div>
                
                <div class="form-group">
                  <label>Choose Your Plan</label>
                  <select id="register-plan" required>
                    <option value="free">Free - Get Started</option>
                    <option value="starter">Starter - $29/month</option>
                    <option value="pro" selected>Pro - $99/month</option>
                    <option value="enterprise">Enterprise - Custom</option>
                  </select>
                </div>
                
                <button type="submit" class="btn-primary">Create Account</button>
              </form>
              
              <div class="auth-footer">
                <p>Already have an account? <a href="#login">Sign In</a></p>
                <p class="terms">By creating an account, you agree to our Terms of Service and Privacy Policy</p>
              </div>
            </div>
          </div>
        </div>
      `;
      
      this.renderAuthForm(formHTML);
      this.attachRegisterHandlers();
    }

    /**
     * Render authentication form
     */
    renderAuthForm(html) {
      // Remove any existing auth modal
      const existing = document.getElementById('auth-modal');
      if (existing) {
        existing.remove();
      }
      
      // Add form to page
      const div = document.createElement('div');
      div.innerHTML = html;
      document.body.appendChild(div.firstElementChild);
      
      // Add styles if not already present
      if (!document.getElementById('siteoptz-auth-styles')) {
        this.injectStyles();
      }
    }

    /**
     * Attach login form handlers
     */
    attachLoginHandlers() {
      const form = document.getElementById('login-form');
      if (!form) return;
      
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        await this.login(email, password);
      });
    }

    /**
     * Attach register form handlers
     */
    attachRegisterHandlers() {
      const form = document.getElementById('register-form');
      if (!form) return;
      
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const plan = document.getElementById('register-plan').value;
        
        await this.register(name, email, password, plan);
      });
    }

    /**
     * Login user
     */
    async login(email, password) {
      this.showMessage('info', 'Signing in...');
      
      try {
        // Check if contact exists in GoHighLevel
        const contact = await this.findContactByEmail(email);
        
        if (!contact) {
          this.showMessage('error', 'No account found with this email. Please create an account.');
          setTimeout(() => {
            window.location.hash = '#register';
          }, 2000);
          return;
        }
        
        // In production, verify password properly
        // For now, simple check (replace with proper verification)
        if (password.length < 6) {
          this.showMessage('error', 'Invalid password');
          return;
        }
        
        // Get user's plan from tags
        const plan = this.extractPlanFromContact(contact);
        
        // Create user session
        const userData = {
          id: contact.id,
          email: contact.email,
          name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
          plan: plan || 'free',
          authenticated: true
        };
        
        this.saveUserToStorage(userData);
        this.currentUser = userData;
        
        this.showMessage('success', 'Login successful! Redirecting...');
        
        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = `${CONFIG.DASHBOARD_BASE_URL}/${userData.plan}`;
        }, 1500);
        
      } catch (error) {
        console.error('Login error:', error);
        this.showMessage('error', 'Login failed. Please try again.');
      }
    }

    /**
     * Register new user
     */
    async register(name, email, password, plan) {
      this.showMessage('info', 'Creating your account...');
      
      try {
        // Check if user already exists
        const existingContact = await this.findContactByEmail(email);
        
        if (existingContact) {
          this.showMessage('error', 'An account with this email already exists. Please sign in.');
          setTimeout(() => {
            window.location.hash = '#login';
          }, 2000);
          return;
        }
        
        // Create new contact in GoHighLevel
        const newContact = await this.createContact({
          email,
          firstName: name.split(' ')[0],
          lastName: name.split(' ').slice(1).join(' '),
          tags: [CONFIG.PLAN_TAGS[plan]],
          customFields: {
            password_hash: this.hashPassword(password), // Simple hash for demo
            plan: plan
          }
        });
        
        // Create user session
        const userData = {
          id: newContact.id,
          email: newContact.email,
          name: name,
          plan: plan,
          authenticated: true
        };
        
        this.saveUserToStorage(userData);
        this.currentUser = userData;
        
        this.showMessage('success', 'Account created successfully! Redirecting...');
        
        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = `${CONFIG.DASHBOARD_BASE_URL}/${plan}`;
        }, 1500);
        
      } catch (error) {
        console.error('Registration error:', error);
        this.showMessage('error', 'Failed to create account. Please try again.');
      }
    }

    /**
     * Find contact by email in GoHighLevel
     */
    async findContactByEmail(email) {
      try {
        const response = await fetch(`${CONFIG.GHL_BASE_URL}/contacts/?query=${email}&locationId=${CONFIG.GHL_LOCATION_ID}`, {
          headers: {
            'Authorization': `Bearer ${CONFIG.GHL_API_KEY}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28'
          }
        });
        
        const data = await response.json();
        
        if (data.contacts && data.contacts.length > 0) {
          // Find exact email match
          return data.contacts.find(c => c.email === email) || null;
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
        const response = await fetch(`${CONFIG.GHL_BASE_URL}/contacts/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CONFIG.GHL_API_KEY}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28'
          },
          body: JSON.stringify({
            ...contactData,
            locationId: CONFIG.GHL_LOCATION_ID
          })
        });
        
        const data = await response.json();
        return data.contact;
        
      } catch (error) {
        console.error('Error creating contact:', error);
        throw error;
      }
    }

    /**
     * Extract plan from contact tags
     */
    extractPlanFromContact(contact) {
      if (!contact || !contact.tags) return 'free';
      
      const tags = Array.isArray(contact.tags) ? contact.tags : [];
      
      for (const [plan, tag] of Object.entries(CONFIG.PLAN_TAGS)) {
        if (tags.includes(tag)) {
          return plan;
        }
      }
      
      return 'free';
    }

    /**
     * Simple password hash (replace with bcrypt in production)
     */
    hashPassword(password) {
      // This is a simple hash for demo - use bcrypt in production!
      return btoa(password);
    }

    /**
     * Check if user is authenticated
     */
    checkAuthentication() {
      if (!this.currentUser || !this.currentUser.authenticated) {
        window.location.hash = '#login';
        return false;
      }
      return true;
    }

    /**
     * Logout user
     */
    logout() {
      this.currentUser = null;
      localStorage.removeItem('siteoptz_user');
      window.location.hash = '';
      this.showMessage('success', 'You have been logged out');
    }

    /**
     * Show message to user
     */
    showMessage(type, message) {
      const messageDiv = document.getElementById('auth-message');
      if (!messageDiv) return;
      
      messageDiv.className = `auth-message ${type}`;
      messageDiv.innerHTML = message;
      messageDiv.style.display = 'block';
    }

    /**
     * Save user to localStorage
     */
    saveUserToStorage(userData) {
      localStorage.setItem('siteoptz_user', JSON.stringify(userData));
    }

    /**
     * Load user from localStorage
     */
    loadUserFromStorage() {
      try {
        const userData = localStorage.getItem('siteoptz_user');
        return userData ? JSON.parse(userData) : null;
      } catch (error) {
        return null;
      }
    }

    /**
     * Inject CSS styles
     */
    injectStyles() {
      const styles = `
        <style id="siteoptz-auth-styles">
          .auth-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
          }
          
          .auth-container {
            width: 90%;
            max-width: 450px;
          }
          
          .auth-card {
            background: white;
            border-radius: 12px;
            padding: 2rem;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            position: relative;
          }
          
          .close-btn {
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #666;
          }
          
          .auth-card h2 {
            margin: 0 0 0.5rem 0;
            color: #333;
            font-size: 1.75rem;
          }
          
          .auth-card p {
            margin: 0 0 1.5rem 0;
            color: #666;
          }
          
          .form-group {
            margin-bottom: 1.25rem;
          }
          
          .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            color: #333;
            font-weight: 500;
          }
          
          .form-group input,
          .form-group select {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #ddd;
            border-radius: 6px;
            font-size: 1rem;
            transition: border-color 0.3s;
          }
          
          .form-group input:focus,
          .form-group select:focus {
            outline: none;
            border-color: #4CAF50;
          }
          
          .btn-primary {
            width: 100%;
            padding: 0.875rem;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.3s;
          }
          
          .btn-primary:hover {
            background: #45a049;
          }
          
          .btn-primary:disabled {
            background: #ccc;
            cursor: not-allowed;
          }
          
          .auth-footer {
            margin-top: 1.5rem;
            text-align: center;
          }
          
          .auth-footer p {
            margin: 0.5rem 0;
            color: #666;
            font-size: 0.9rem;
          }
          
          .auth-footer a {
            color: #4CAF50;
            text-decoration: none;
            font-weight: 500;
          }
          
          .auth-footer a:hover {
            text-decoration: underline;
          }
          
          .terms {
            font-size: 0.8rem !important;
            color: #999 !important;
            margin-top: 1rem !important;
          }
          
          .auth-message {
            padding: 0.75rem;
            border-radius: 6px;
            margin-bottom: 1rem;
            display: none;
          }
          
          .auth-message.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
          }
          
          .auth-message.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
          }
          
          .auth-message.info {
            background: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
          }
          
          @media (max-width: 480px) {
            .auth-card {
              padding: 1.5rem;
            }
          }
        </style>
      `;
      
      document.head.insertAdjacentHTML('beforeend', styles);
    }

    /**
     * Get current user
     */
    getCurrentUser() {
      return this.currentUser;
    }

    /**
     * Check if user has access to specific plan
     */
    hasAccessToPlan(requiredPlan) {
      if (!this.currentUser) return false;
      
      const planHierarchy = {
        'free': 1,
        'starter': 2,
        'pro': 3,
        'enterprise': 4
      };
      
      const userLevel = planHierarchy[this.currentUser.plan] || 0;
      const requiredLevel = planHierarchy[requiredPlan] || 0;
      
      return userLevel >= requiredLevel;
    }
  }

  // Initialize authentication when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.SiteOptzAuth = new SiteOptzAuth();
    });
  } else {
    window.SiteOptzAuth = new SiteOptzAuth();
  }

  // Expose API for external use
  window.SiteOptzAuthAPI = {
    login: (email, password) => window.SiteOptzAuth.login(email, password),
    register: (name, email, password, plan) => window.SiteOptzAuth.register(name, email, password, plan),
    logout: () => window.SiteOptzAuth.logout(),
    getCurrentUser: () => window.SiteOptzAuth.getCurrentUser(),
    hasAccessToPlan: (plan) => window.SiteOptzAuth.hasAccessToPlan(plan),
    checkAuthentication: () => window.SiteOptzAuth.checkAuthentication()
  };

})();