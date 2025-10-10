import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthenticationService from '../services/AuthenticationService';
import './GetStartedForm.css';

const GetStartedForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [redirectMessage, setRedirectMessage] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(null);
    setRedirectMessage(null);
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
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
    setRedirectMessage(null);

    try {
      const result = await AuthenticationService.handleGetStarted({
        email: formData.email,
        name: formData.name,
        password: formData.password,
        authMethod: 'email'
      });

      if (result.success) {
        // New user created - redirect to free dashboard
        navigate(result.redirect);
      } else if (result.action === 'REDIRECT_TO_LOGIN') {
        // User already exists - show message and redirect to login
        setRedirectMessage(result.message);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Get Started error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignup = async (provider) => {
    setLoading(true);
    setError(null);
    
    try {
      // Initiate OAuth flow for signup
      window.location.href = `/api/auth/${provider}?action=signup`;
    } catch (error) {
      setError(`Failed to sign up with ${provider}`);
      setLoading(false);
    }
  };

  return (
    <div className="get-started-form-container">
      <div className="get-started-form-card">
        <h2>Get Started with SiteOptz</h2>
        <p className="form-subtitle">Create your free account and start optimizing your site today!</p>

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {redirectMessage && (
          <div className="redirect-message">
            <span className="redirect-icon">ℹ️</span>
            {redirectMessage}
            <div className="redirect-timer">Redirecting to Log In...</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="John Doe"
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
              required
              placeholder="you@example.com"
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
              required
              placeholder="At least 8 characters"
              minLength="8"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Re-enter your password"
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Get Started - Free'}
          </button>
        </form>

        <div className="oauth-divider">
          <span>OR</span>
        </div>

        <div className="oauth-buttons">
          <button
            className="oauth-button google"
            onClick={() => handleOAuthSignup('google')}
            disabled={loading}
          >
            <span className="oauth-icon">G</span>
            Sign up with Google
          </button>
          
          <button
            className="oauth-button github"
            onClick={() => handleOAuthSignup('github')}
            disabled={loading}
          >
            <span className="oauth-icon">GH</span>
            Sign up with GitHub
          </button>
        </div>

        <div className="plan-benefits">
          <h4>Your Free Plan Includes:</h4>
          <ul>
            <li>✓ Basic Website Analytics</li>
            <li>✓ SEO Health Check</li>
            <li>✓ Performance Monitoring</li>
            <li>✓ Up to 3 websites</li>
            <li>✓ Email support</li>
          </ul>
        </div>

        <div className="form-footer">
          <p>
            Already have an account? 
            <a href="/login" className="link">Log In</a>
          </p>
          <p className="terms">
            By creating an account, you agree to our 
            <a href="/terms" className="link">Terms of Service</a> and 
            <a href="/privacy" className="link">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default GetStartedForm;