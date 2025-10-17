# 🚀 SiteOptz.ai Authentication Integration Guide

## How to Add Login/Register to siteoptz.ai with Hash Routing

This guide shows you how to implement `/#login` and `/#register` routes on your siteoptz.ai website using the same GoHighLevel authentication logic.

---

## 📋 Implementation Options

### Option 1: Client-Side Only (Simple but has CORS limitations)

**Files Needed:**
- `siteoptz-auth-integration.js` - The authentication module
- `siteoptz-auth-example.html` - Example implementation

**Steps:**

1. **Add to your siteoptz.ai website:**
```html
<!-- Add before closing </body> tag -->
<script src="/js/siteoptz-auth-integration.js"></script>
```

2. **Add navigation links:**
```html
<a href="#login">Login</a>
<a href="#register">Sign Up</a>
```

3. **The script automatically handles:**
- Shows login form when URL is `siteoptz.ai/#login`
- Shows register form when URL is `siteoptz.ai/#register`
- Stores user session in localStorage
- Redirects to appropriate dashboard after authentication

**⚠️ CORS Issue:** Direct browser-to-GoHighLevel API calls may be blocked. Use Option 2 for production.

---

### Option 2: With Server Proxy (Recommended for Production)

**Files Needed:**
- `siteoptz-auth-proxy.js` - Node.js proxy server
- Modified `siteoptz-auth-integration.js` - Update API calls to use proxy

**Steps:**

1. **Deploy the proxy server:**

```bash
# Install dependencies
npm install express cors axios

# Run locally for testing
node siteoptz-auth-proxy.js

# Or deploy to your server/Vercel/Netlify
```

2. **Update the integration script to use proxy:**

Replace GoHighLevel API calls in `siteoptz-auth-integration.js`:

```javascript
// Instead of calling GHL directly:
// const response = await fetch(`${CONFIG.GHL_BASE_URL}/contacts/...`

// Call your proxy:
const response = await fetch('https://your-api.siteoptz.ai/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
```

3. **Add to siteoptz.ai:**
```html
<script>
  // Configure API endpoint
  window.SITEOPTZ_API_URL = 'https://your-api.siteoptz.ai';
</script>
<script src="/js/siteoptz-auth-integration.js"></script>
```

---

## 🎨 Customization

### Custom Login Form

Instead of using the built-in forms, create your own:

```html
<div id="custom-login" style="display:none;">
  <form onsubmit="handleCustomLogin(event)">
    <input type="email" id="email" required>
    <input type="password" id="password" required>
    <button type="submit">Login</button>
  </form>
</div>

<script>
function handleCustomLogin(e) {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  // Use the exposed API
  window.SiteOptzAuthAPI.login(email, password);
}

// Show form when hash is #login
if (window.location.hash === '#login') {
  document.getElementById('custom-login').style.display = 'block';
}
</script>
```

### Custom Register Form

```html
<div id="custom-register" style="display:none;">
  <form onsubmit="handleCustomRegister(event)">
    <input type="text" id="name" placeholder="Full Name" required>
    <input type="email" id="email" placeholder="Email" required>
    <input type="password" id="password" placeholder="Password" required>
    <select id="plan">
      <option value="free">Free</option>
      <option value="starter">Starter - $29</option>
      <option value="pro">Pro - $99</option>
      <option value="enterprise">Enterprise</option>
    </select>
    <button type="submit">Sign Up</button>
  </form>
</div>

<script>
function handleCustomRegister(e) {
  e.preventDefault();
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const plan = document.getElementById('plan').value;
  
  window.SiteOptzAuthAPI.register(name, email, password, plan);
}
</script>
```

---

## 🔧 API Reference

### Available Methods

```javascript
// Login user
window.SiteOptzAuthAPI.login(email, password)

// Register new user
window.SiteOptzAuthAPI.register(name, email, password, plan)

// Logout current user
window.SiteOptzAuthAPI.logout()

// Get current user
const user = window.SiteOptzAuthAPI.getCurrentUser()
// Returns: { id, email, name, plan, authenticated }

// Check if user has access to plan
const hasAccess = window.SiteOptzAuthAPI.hasAccessToPlan('pro')

// Check authentication status
const isAuth = window.SiteOptzAuthAPI.checkAuthentication()
```

### Events

Listen for authentication events:

```javascript
// User logged in
window.addEventListener('siteoptz:login', (e) => {
  console.log('User logged in:', e.detail.user);
});

// User registered
window.addEventListener('siteoptz:register', (e) => {
  console.log('User registered:', e.detail.user);
});

// User logged out
window.addEventListener('siteoptz:logout', () => {
  console.log('User logged out');
});
```

---

## 🚀 Quick Start Example

### Minimal Implementation

```html
<!DOCTYPE html>
<html>
<head>
  <title>SiteOptz.ai</title>
</head>
<body>
  <nav>
    <a href="#login">Login</a>
    <a href="#register">Sign Up</a>
    <a href="#logout">Logout</a>
  </nav>

  <div id="user-status"></div>

  <!-- Authentication Script -->
  <script src="/js/siteoptz-auth-integration.js"></script>
  
  <script>
    // Display user status
    function updateStatus() {
      const user = window.SiteOptzAuthAPI?.getCurrentUser();
      const status = document.getElementById('user-status');
      
      if (user && user.authenticated) {
        status.innerHTML = `
          <p>Welcome, ${user.email}!</p>
          <p>Plan: ${user.plan}</p>
          <a href="https://optz.siteoptz.ai/dashboard/${user.plan}">
            Go to Dashboard
          </a>
        `;
      } else {
        status.innerHTML = '<p>Not logged in</p>';
      }
    }
    
    // Update on hash change
    window.addEventListener('hashchange', updateStatus);
    window.addEventListener('load', updateStatus);
  </script>
</body>
</html>
```

---

## 📱 Mobile App Integration

For mobile apps, use the API directly:

```javascript
// React Native example
async function login(email, password) {
  const response = await fetch('https://api.siteoptz.ai/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  if (data.success) {
    // Store token
    await AsyncStorage.setItem('auth_token', data.token);
    // Navigate to dashboard
    navigation.navigate('Dashboard', { plan: data.user.plan });
  }
}
```

---

## 🔒 Security Considerations

1. **Always use HTTPS** in production
2. **Implement rate limiting** on authentication endpoints
3. **Use proper password hashing** (bcrypt, not SHA-256)
4. **Add CSRF protection** for form submissions
5. **Validate and sanitize** all user inputs
6. **Use secure session tokens** (JWT with proper expiration)
7. **Never expose** GoHighLevel API keys in client-side code

---

## 🧪 Testing

### Test URLs

After implementation, test these URLs:

1. **Login:** `https://siteoptz.ai/#login`
2. **Register:** `https://siteoptz.ai/#register`
3. **Logout:** `https://siteoptz.ai/#logout`

### Test Accounts

Create test accounts for each plan:
- `free-test@example.com` → Free plan
- `starter-test@example.com` → Starter plan
- `pro-test@example.com` → Pro plan
- `enterprise-test@example.com` → Enterprise plan

### Verify in GoHighLevel

1. Log into GoHighLevel
2. Go to Contacts
3. Search for test emails
4. Verify tags are correctly applied

---

## 🚨 Troubleshooting

### CORS Errors
**Problem:** "Access to fetch at 'leadconnectorhq.com' has been blocked by CORS"
**Solution:** Use the proxy server (Option 2) instead of direct API calls

### User Not Found
**Problem:** Login says "user not found" but contact exists in GHL
**Solution:** Check that the email matches exactly (case-insensitive)

### Wrong Dashboard
**Problem:** User redirected to wrong plan dashboard
**Solution:** Check contact tags in GoHighLevel - ensure only one plan tag exists

### Token Expired
**Problem:** User gets logged out after some time
**Solution:** Implement token refresh or extend expiration time

---

## 📦 Deployment Checklist

- [ ] Deploy proxy server if using Option 2
- [ ] Update API endpoints in integration script
- [ ] Add script to siteoptz.ai website
- [ ] Test login flow
- [ ] Test registration flow
- [ ] Test logout flow
- [ ] Verify dashboard redirects work
- [ ] Check mobile responsiveness
- [ ] Test on different browsers
- [ ] Monitor error logs

---

## 🎯 Next Steps

1. **Customize the forms** to match your brand
2. **Add email verification** for new registrations
3. **Implement password reset** functionality
4. **Add social login** (Google, Facebook)
5. **Set up analytics** to track conversions
6. **Create onboarding flow** for new users
7. **Add subscription management** for plan upgrades

---

## 💡 Pro Tips

1. **Pre-fill forms:** If user comes from a specific campaign, pre-fill the plan
2. **Remember me:** Add a "Remember me" checkbox to keep users logged in
3. **Loading states:** Show spinners during authentication
4. **Error recovery:** Provide clear next steps when errors occur
5. **Deep linking:** Support URLs like `/#login?redirect=/dashboard/pro`

---

## 🆘 Support

If you need help:
1. Check the browser console for errors
2. Verify GoHighLevel API credentials
3. Test with the example HTML file first
4. Check network tab for API responses

**Remember:** The authentication system uses the same GoHighLevel backend as your optz.siteoptz.ai dashboard, so users can seamlessly move between siteoptz.ai and the dashboard!