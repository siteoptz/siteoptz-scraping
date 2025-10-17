// Get Started Form Component
// Handles new user registration and redirects to appropriate dashboard

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import GHLAuthService from '../services/GHLAuthService';
import './AuthForms.css';

const GetStartedForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    name: '',
    email: location.state?.email || '',
    password: '',
    confirmPassword: '',
    plan: 'free'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showMessage, setShowMessage] = useState(null);

  useEffect(() => {
    // Check if already authenticated
    if (GHLAuthService.isAuthenticated()) {
      const user = GHLAuthService.getCurrentUser();
      navigate(`/dashboard/${user.plan}`);
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear errors when user starts typing
    if (error) setError(null);
    if (showMessage) setShowMessage(null);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Please enter your name');
      return false;
    }

    if (!formData.email || !formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);
    setShowMessage(null);

    try {
      // Attempt to create account
      const result = await GHLAuthService.signUpWithEmail(
        formData.email,
        formData.password,
        formData.name,
        formData.plan
      );

      if (result.success) {
        // Account created successfully - redirect to dashboard
        console.log('✅ Account created, redirecting to:', result.redirectTo);
        
        // Show success message briefly before redirect
        setShowMessage({
          type: 'success',
          title: 'Welcome to SiteOptz.ai!',
          text: 'Your account has been created. Redirecting to your dashboard...'
        });

        // Redirect after 2 seconds
        setTimeout(() => {
          navigate(result.redirectTo);
        }, 2000);

      } else {
        // Account creation failed
        if (result.error === 'user_exists') {
          // User already exists - show message and offer login
          setShowMessage({
            type: 'info',
            title: 'Account Already Exists',
            text: result.message,
            action: {
              label: 'Go to Login',
              onClick: () => navigate('/login', {
                state: { email: formData.email }
              })
            }
          });
        } else {
          setError(result.message || 'Failed to create account. Please try again.');
        }
      }

    } catch (error) {
      console.error('Sign up error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignup = async () => {
    try {
      setLoading(true);
      await GHLAuthService.initiateOAuth();
    } catch (error) {
      console.error('OAuth error:', error);
      setError('Failed to initiate OAuth. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Get Started with SiteOptz.ai</h1>
          <p>Create your account and start scaling your agency with AI</p>
        </div>

        {showMessage && (
          <div className={`message-box ${showMessage.type}`}>
            <div className="message-icon">
              {showMessage.type === 'info' && 'ℹ️'}
              {showMessage.type === 'success' && '✅'}
              {showMessage.type === 'error' && '❌'}
            </div>
            <div className="message-content">
              <h3>{showMessage.title}</h3>
              <p>{showMessage.text}</p>
              {showMessage.action && (
                <button 
                  className="message-action-btn"
                  onClick={showMessage.action.onClick}
                >
                  {showMessage.action.label} →
                </button>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="error-box">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              required
              disabled={loading}
              minLength="6"
            />
            <span className="form-hint">Minimum 6 characters</span>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
              required
              disabled={loading}
              minLength="6"
            />
          </div>

          <div className="form-group">
            <label htmlFor="plan">Choose Your Plan</label>
            <select
              id="plan"
              name="plan"
              value={formData.plan}
              onChange={handleChange}
              disabled={loading}
              className="plan-select"
            >
              <option value="free">Free - Get Started</option>
              <option value="starter">Starter - $29/month</option>
              <option value="pro">Pro - $99/month</option>
              <option value="enterprise">Enterprise - Custom</option>
            </select>
            <span className="form-hint">You can upgrade anytime</span>
          </div>

          <button 
            type="submit" 
            className="btn-primary"
            disabled={loading}
          >
            {loading ? (
              <span className="loading-spinner">🔄 Creating account...</span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <div className="alternative-auth">
          <button 
            type="button"
            className="btn-oauth"
            onClick={handleOAuthSignup}
            disabled={loading}
          >
            <span className="oauth-icon">🔐</span>
            Sign up with GoHighLevel
          </button>
        </div>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <button 
              className="link-button"
              onClick={() => navigate('/login')}
            >
              Sign In
            </button>
          </p>
        </div>

        <div className="terms-notice">
          <p>
            By creating an account, you agree to our{' '}
            <a href="/terms" target="_blank">Terms of Service</a> and{' '}
            <a href="/privacy" target="_blank">Privacy Policy</a>
          </p>
        </div>
      </div>

      <div className="auth-features">
        <h3>What You'll Get</h3>
        <ul>
          <li>
            <span className="feature-icon">🎯</span>
            <div>
              <strong>Start Free</strong>
              <p>No credit card required to get started</p>
            </div>
          </li>
          <li>
            <span className="feature-icon">🚀</span>
            <div>
              <strong>AI-Powered Tools</strong>
              <p>Access to cutting-edge AI SEO automation</p>
            </div>
          </li>
          <li>
            <span className="feature-icon">💼</span>
            <div>
              <strong>White-Label Ready</strong>
              <p>Resell services under your own brand</p>
            </div>
          </li>
          <li>
            <span className="feature-icon">📊</span>
            <div>
              <strong>Complete Dashboard</strong>
              <p>Manage clients and track results in one place</p>
            </div>
          </li>
        </ul>

        <div className="pricing-preview">
          <h4>Pricing Plans</h4>
          <div className="plan-cards">
            <div className="plan-mini">
              <span className="plan-name">Free</span>
              <span className="plan-price">$0</span>
            </div>
            <div className="plan-mini">
              <span className="plan-name">Starter</span>
              <span className="plan-price">$29</span>
            </div>
            <div className="plan-mini highlighted">
              <span className="plan-name">Pro</span>
              <span className="plan-price">$99</span>
              <span className="plan-badge">Popular</span>
            </div>
            <div className="plan-mini">
              <span className="plan-name">Enterprise</span>
              <span className="plan-price">Custom</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GetStartedForm;
