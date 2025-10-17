// Login Form Component
// Handles user authentication and redirects to appropriate dashboard

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GHLAuthService from '../services/GHLAuthService';
import './AuthForms.css';

const LoginForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setShowMessage(null);

    try {
      // Validate inputs
      if (!formData.email || !formData.password) {
        setError('Please enter both email and password');
        setLoading(false);
        return;
      }

      // Attempt login
      const result = await GHLAuthService.loginWithEmail(
        formData.email,
        formData.password
      );

      if (result.success) {
        // Login successful - redirect to user's dashboard
        console.log('✅ Redirecting to:', result.redirectTo);
        navigate(result.redirectTo);
      } else {
        // Login failed - show appropriate message
        if (result.error === 'user_not_found') {
          // User doesn't exist - show message and offer Get Started
          setShowMessage({
            type: 'info',
            title: 'Account Not Found',
            text: result.message,
            action: {
              label: 'Create Account',
              onClick: () => navigate('/get-started', {
                state: { email: formData.email }
              })
            }
          });
        } else if (result.error === 'invalid_password') {
          setError('Incorrect password. Please try again.');
        } else {
          setError(result.message || 'Login failed. Please try again.');
        }
      }

    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async () => {
    try {
      setLoading(true);
      await GHLAuthService.initiateOAuth();
    } catch (error) {
      console.error('OAuth error:', error);
      setError('Failed to initiate OAuth. Please try again.');
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!formData.email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const result = await GHLAuthService.sendMagicLink(formData.email);
      
      if (result.success) {
        setShowMessage({
          type: 'success',
          title: 'Magic Link Sent!',
          text: 'Check your email for a login link. It expires in 15 minutes.'
        });
      } else {
        if (result.error === 'user_not_found') {
          setShowMessage({
            type: 'info',
            title: 'Account Not Found',
            text: result.message,
            action: {
              label: 'Create Account',
              onClick: () => navigate('/get-started')
            }
          });
        } else {
          setError(result.message);
        }
      }
    } catch (error) {
      setError('Failed to send magic link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome Back</h1>
          <p>Sign in to access your dashboard</p>
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
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary"
            disabled={loading}
          >
            {loading ? (
              <span className="loading-spinner">🔄 Signing in...</span>
            ) : (
              'Sign In'
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
            onClick={handleOAuthLogin}
            disabled={loading}
          >
            <span className="oauth-icon">🔐</span>
            Sign in with GoHighLevel
          </button>

          <button 
            type="button"
            className="btn-magic-link"
            onClick={handleMagicLink}
            disabled={loading || !formData.email}
          >
            <span className="magic-icon">✨</span>
            Send Magic Link
          </button>
        </div>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <button 
              className="link-button"
              onClick={() => navigate('/get-started')}
            >
              Get Started
            </button>
          </p>
          <button 
            className="link-button forgot-password"
            onClick={() => setShowMessage({
              type: 'info',
              title: 'Reset Password',
              text: 'Enter your email above and click "Send Magic Link" to reset your password.'
            })}
          >
            Forgot password?
          </button>
        </div>
      </div>

      <div className="auth-features">
        <h3>Why SiteOptz.ai?</h3>
        <ul>
          <li>
            <span className="feature-icon">🤖</span>
            <div>
              <strong>AI-Powered SEO</strong>
              <p>Deliver enterprise-grade SEO with 90% automation</p>
            </div>
          </li>
          <li>
            <span className="feature-icon">💰</span>
            <div>
              <strong>60-80% Profit Margins</strong>
              <p>Keep more of what you earn with AI efficiency</p>
            </div>
          </li>
          <li>
            <span className="feature-icon">📈</span>
            <div>
              <strong>Scale Unlimited</strong>
              <p>Handle 50+ clients without hiring</p>
            </div>
          </li>
          <li>
            <span className="feature-icon">⚡</span>
            <div>
              <strong>10x Faster Delivery</strong>
              <p>Complete monthly work in minutes, not weeks</p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default LoginForm;
