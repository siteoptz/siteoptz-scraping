# 🔌 GoHighLevel Logic Integration for Existing SiteOptz.ai Authentication

## Quick Integration Guide

Since you already have login and register forms at `siteoptz.ai/#login` and `/#register`, here's how to add the GoHighLevel conditional logic to your existing authentication.

---

## 📋 What This Does

Adds the following logic to your existing forms:

### Login (`/#login`):
```
User enters email/password
  ↓
Check if user exists in GoHighLevel
  ↓
IF NOT FOUND → Show "No account found" → Redirect to /#register
IF FOUND → Verify password → Get plan from tags → Redirect to dashboard/{plan}
```

### Register (`/#register`):
```
User enters details + selects plan
  ↓
Check if email already exists in GoHighLevel
  ↓
IF EXISTS → Show "Account exists" → Redirect to /#login
IF NOT EXISTS → Create contact with plan tag → Auto-login → Redirect to dashboard/{plan}
```

---

## 🚀 Step 1: Add the Script

Add this to your siteoptz.ai website (before your existing auth code):

```html
<!-- GoHighLevel Authentication Logic -->
<script src="/js/siteoptz-ghl-auth-logic.js"></script>
```

---

## 🔧 Step 2: Update Your Existing Login Handler

Find your current login form handler and update it:

### Before (your current code):
```javascript
function handleLogin(email, password) {
  // Your current login logic
  authenticateUser(email, password);
}
```

### After (with GHL logic):
```javascript
function handleLogin(email, password) {
  // Use the GHL auth handler
  SiteOptzGHLAuth.handleLogin(
    email,
    password,
    
    // Success callback
    function(result) {
      // User authenticated successfully
      console.log('User:', result.user);
      console.log('Redirecting to:', result.redirectUrl);
      
      // Show success message (optional)
      showMessage('success', result.message);
      
      // User will be auto-redirected to their dashboard
    },
    
    // Error callback
    function(error) {
      if (error.type === 'user_not_found') {
        // User doesn't exist - show message and button to register
        showMessage('info', error.message);
        showButton('Create Account', () => {
          window.location.hash = '#register';
        });
      } else {
        // Other error (wrong password, etc)
        showMessage('error', error.message);
      }
    }
  );
}
```

---

## 🔧 Step 3: Update Your Existing Register Handler

Find your current register form handler and update it:

### Before (your current code):
```javascript
function handleRegister(name, email, password, plan) {
  // Your current registration logic
  createUser(name, email, password);
}
```

### After (with GHL logic):
```javascript
function handleRegister(name, email, password, plan) {
  // Use the GHL auth handler
  SiteOptzGHLAuth.handleRegister(
    {
      name: name,
      email: email,
      password: password,
      plan: plan || 'free'
    },
    
    // Success callback
    function(result) {
      // Account created successfully
      console.log('User:', result.user);
      console.log('Redirecting to:', result.redirectUrl);
      
      // Show success message (optional)
      showMessage('success', result.message);
      
      // User will be auto-redirected to their dashboard
    },
    
    // Error callback
    function(error) {
      if (error.type === 'user_exists') {
        // User already exists - show message and button to login
        showMessage('info', error.message);
        showButton('Go to Login', () => {
          window.location.hash = '#login';
        });
      } else {
        // Other error
        showMessage('error', error.message);
      }
    }
  );
}
```

---

## 🎯 Real-World Examples

### Example 1: With jQuery
```javascript
$('#login-form').on('submit', function(e) {
  e.preventDefault();
  
  const email = $('#email').val();
  const password = $('#password').val();
  
  // Show loading
  $('.submit-btn').prop('disabled', true).text('Signing in...');
  
  SiteOptzGHLAuth.handleLogin(email, password,
    // Success
    function(result) {
      $('#error-msg').hide();
      $('#success-msg').text(result.message).show();
      // Auto-redirects to dashboard
    },
    // Error
    function(error) {
      $('.submit-btn').prop('disabled', false).text('Sign In');
      
      if (error.type === 'user_not_found') {
        $('#error-msg').html(
          error.message + 
          ' <a href="#register">Create Account</a>'
        ).show();
      } else {
        $('#error-msg').text(error.message).show();
      }
    }
  );
});
```

### Example 2: With Vanilla JavaScript
```javascript
document.getElementById('login-form').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  // Show loading
  const btn = document.querySelector('.submit-btn');
  btn.disabled = true;
  btn.textContent = 'Signing in...';
  
  SiteOptzGHLAuth.handleLogin(email, password,
    // Success
    function(result) {
      document.getElementById('message').className = 'success';
      document.getElementById('message').textContent = result.message;
      // Auto-redirects to dashboard
    },
    // Error
    function(error) {
      btn.disabled = false;
      btn.textContent = 'Sign In';
      
      const msgEl = document.getElementById('message');
      msgEl.className = 'error';
      
      if (error.type === 'user_not_found') {
        msgEl.innerHTML = `${error.message} <a href="#register">Create Account</a>`;
      } else {
        msgEl.textContent = error.message;
      }
    }
  );
});
```

### Example 3: With React/Vue/Angular
```javascript
// React example
const handleLogin = async (email, password) => {
  setLoading(true);
  
  SiteOptzGHLAuth.handleLogin(
    email,
    password,
    // Success
    (result) => {
      setMessage({ type: 'success', text: result.message });
      // Auto-redirects to dashboard
    },
    // Error
    (error) => {
      setLoading(false);
      
      if (error.type === 'user_not_found') {
        setMessage({
          type: 'info',
          text: error.message,
          action: {
            label: 'Create Account',
            onClick: () => navigate('#register')
          }
        });
      } else {
        setMessage({ type: 'error', text: error.message });
      }
    }
  );
};
```

---

## 🔑 Available Methods

```javascript
// Check if user is logged in
const isLoggedIn = SiteOptzGHLAuth.isAuthenticated();

// Get current user
const user = SiteOptzGHLAuth.getCurrentUser();
// Returns: { id, email, name, plan, authenticated }

// Logout
SiteOptzGHLAuth.logout();

// Update user plan (for upgrades)
SiteOptzGHLAuth.updateUserPlan(userId, 'pro');
```

---

## ⚙️ Configuration

Update the configuration in the script:

```javascript
window.SiteOptzGHLConfig = {
  // Your proxy server URL (to avoid CORS)
  PROXY_URL: 'https://api.siteoptz.ai',
  
  // Dashboard URLs for each plan
  DASHBOARD_URLS: {
    free: 'https://optz.siteoptz.ai/dashboard/free',
    starter: 'https://optz.siteoptz.ai/dashboard/starter',
    pro: 'https://optz.siteoptz.ai/dashboard/pro',
    enterprise: 'https://optz.siteoptz.ai/dashboard/enterprise'
  },
  
  // Auto-redirect after login (set to false to handle manually)
  AUTO_REDIRECT: true
};
```

---

## 🚨 Important: Proxy Server Required

Due to CORS restrictions, you need to deploy the proxy server (`siteoptz-auth-proxy.js`) that handles the GoHighLevel API calls:

1. **Deploy the proxy server** (provided in `siteoptz-auth-proxy.js`)
2. **Update PROXY_URL** in the configuration to point to your proxy
3. **The proxy handles** all GoHighLevel API calls securely

---

## 📊 Error Types Reference

### Login Errors:
- `user_not_found` - Email not in GoHighLevel → Redirect to register
- `invalid_password` - Wrong password → Show error
- `network_error` - Connection issue → Show retry message

### Register Errors:
- `user_exists` - Email already in GoHighLevel → Redirect to login
- `registration_failed` - Could not create contact → Show error
- `network_error` - Connection issue → Show retry message

---

## 🧪 Testing

1. **Test "User Not Found":**
   - Try logging in with: `nonexistent@example.com`
   - Should show: "No account found" with link to register

2. **Test "User Exists":**
   - Try registering with: `test-auth@example.com` (already in GHL)
   - Should show: "Account exists" with link to login

3. **Test Successful Login:**
   - Login with existing GHL contact
   - Should redirect to appropriate dashboard

4. **Test Successful Register:**
   - Register with new email
   - Should create contact in GHL and redirect to dashboard

---

## 💡 Tips

1. **Preserve your existing UI** - Just update the handlers, keep your design
2. **Add loading states** - Show spinners during API calls
3. **Handle errors gracefully** - Show user-friendly messages
4. **Test thoroughly** - Check all scenarios before going live

---

## ✅ Summary

You only need to:
1. Add the script to your page
2. Update your login handler to use `SiteOptzGHLAuth.handleLogin()`
3. Update your register handler to use `SiteOptzGHLAuth.handleRegister()`
4. Deploy the proxy server to handle API calls

The script handles all the GoHighLevel logic:
- Checking if users exist
- Creating new contacts
- Managing plan tags
- Redirecting to the correct dashboard
- Showing appropriate error messages

Your existing forms and UI remain unchanged!