import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthenticationService from '../services/AuthenticationService';
import './LoginForm.css';

const LoginForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setRedirectMessage(null);

    try {
      const result = await AuthenticationService.handleLogin(
        formData.email,
        formData.password,
        'email'
      );

      if (result.success) {
        // Successful login - redirect to appropriate dashboard
        navigate(result.redirect);
      } else if (result.action === 'REDIRECT_TO_SIGNUP') {
        // User not found - show message and redirect option
        setRedirectMessage(result.message);
        setTimeout(() => {
          navigate('/get-started');
        }, 3000);
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider) => {
    setLoading(true);
    setError(null);
    
    try {
      // Initiate OAuth flow
      // This would typically redirect to the OAuth provider
      window.location.href = `/api/auth/${provider}`;
    } catch (error) {
      setError(`Failed to login with ${provider}`);
      setLoading(false);
    }
  };

  return (
    <div className="login-form-container">
      <div className="login-form-card">
        <h2>Log In to SiteOptz</h2>
        <p className="form-subtitle">Welcome back! Please enter your credentials.</p>

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
            <div className="redirect-timer">Redirecting to Get Started...</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
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
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="oauth-divider">
          <span>OR</span>
        </div>

        <div className="oauth-buttons">
          <button
            className="oauth-button google"
            onClick={() => handleOAuthLogin('google')}
            disabled={loading}
          >
            <span className="oauth-icon">G</span>
            Continue with Google
          </button>
          
          <button
            className="oauth-button github"
            onClick={() => handleOAuthLogin('github')}
            disabled={loading}
          >
            <span className="oauth-icon">GH</span>
            Continue with GitHub
          </button>
        </div>

        <div className="form-footer">
          <p>
            New to SiteOptz? 
            <a href="/get-started" className="link">Get Started</a>
          </p>
          <p>
            <a href="/forgot-password" className="link">Forgot Password?</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;