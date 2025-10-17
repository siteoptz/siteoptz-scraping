# GoHighLevel Authentication Implementation Guide

## 🎯 Overview

This guide explains how the OAuth and email/password authentication system works with GoHighLevel tags to route users to the correct dashboard based on their plan.

---

## 🏗️ System Architecture

### Authentication Flow

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       ├─────────────┐
       │             │
  [Login]      [Get Started]
       │             │
       ▼             ▼
┌──────────────────────────────┐
│  GHLAuthService              │
│  - Check if user exists      │
│  - Verify plan via tags      │
│  - Create session            │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│  Route to Dashboard          │
│  /dashboard/{plan}           │
│  - free                      │
│  - starter                   │
│  - pro                       │
│  - enterprise                │
└──────────────────────────────┘
```

---

## 📋 GoHighLevel Plan Tags

The system uses these tags in GHL to identify user plans:

| Plan | GHL Tag | Dashboard Route |
|------|---------|----------------|
| Free | `siteoptz-plan-free` | `/dashboard/free` |
| Starter | `siteoptz-plan-starter` | `/dashboard/starter` |
| Pro | `siteoptz-plan-pro` | `/dashboard/pro` |
| Enterprise | `siteoptz-plan-enterprise` | `/dashboard/enterprise` |

---

## 🔐 Authentication Methods

### 1. Email/Password Login

**For Existing Users:**

```javascript
// User tries to log in
const result = await GHLAuthService.loginWithEmail(email, password);

if (result.success) {
  // ✅ User exists and password is correct
  // Redirect to: /dashboard/{plan}
  navigate(result.redirectTo);
} else if (result.error === 'user_not_found') {
  // ❌ User doesn't exist
  // Show message: "No account found. Please create an account."
  // Action button: "Create Account" → redirect to /get-started
}
```

**Process:**
1. User enters email and password
2. System searches for contact in GHL by email
3. If not found → Show "User not found" message with link to Get Started
4. If found → Verify password
5. Extract plan from GHL tags
6. Create session and redirect to `/dashboard/{plan}`

### 2. Get Started (Sign Up)

**For New Users:**

```javascript
// User tries to create account
const result = await GHLAuthService.signUpWithEmail(email, password, name, plan);

if (result.success) {
  // ✅ Account created
  // Redirect to: /dashboard/{plan}
  navigate(result.redirectTo);
} else if (result.error === 'user_exists') {
  // ❌ User already exists
  // Show message: "Account already exists. Please log in."
  // Action button: "Go to Login" → redirect to /login
}
```

**Process:**
1. User enters name, email, password, and selects plan
2. System searches for existing contact in GHL by email
3. If exists → Show "Account already exists" message with link to Login
4. If not exists → Create new contact in GHL
5. Assign plan tag: `siteoptz-plan-{plan}`
6. Store password hash in GHL custom field
7. Create session and redirect to `/dashboard/{plan}`

### 3. OAuth with GoHighLevel

**Process:**
1. User clicks "Sign in with GoHighLevel"
2. Redirect to GHL OAuth consent screen
3. User authorizes the app
4. GHL redirects back with code
5. Exchange code for access token
6. Fetch user's contact info
7. Extract plan from tags
8. Create session and redirect to `/dashboard/{plan}`

---

## 🔍 How It Works: Detailed Flow

### Login Flow

```javascript
// 1. User submits login form
handleSubmit(email, password)

// 2. Check if contact exists in GHL
const contact = await findContactByEmail(email)

if (!contact) {
  // ❌ USER NOT FOUND
  return {
    success: false,
    error: 'user_not_found',
    message: 'No account found. Please create an account using Get Started.',
    redirectTo: '/get-started'
  }
}

// 3. Verify password
const valid = await verifyPassword(contact, password)

if (!valid) {
  return { error: 'invalid_password' }
}

// 4. Extract plan from tags
const plan = extractPlanFromContact(contact)
// Checks contact.tags for: siteoptz-plan-free, siteoptz-plan-starter, etc.

// 5. Create session
const userData = {
  id: contact.id,
  email: contact.email,
  name: contact.firstName + ' ' + contact.lastName,
  plan: plan || 'free',
  authenticated: true
}

localStorage.setItem('user_data', JSON.stringify(userData))

// 6. Redirect
return {
  success: true,
  redirectTo: `/dashboard/${plan}`
}
```

### Sign Up Flow

```javascript
// 1. User submits get started form
handleSubmit(email, password, name, plan)

// 2. Check if contact already exists
const existing = await findContactByEmail(email)

if (existing) {
  // ❌ USER ALREADY EXISTS
  return {
    success: false,
    error: 'user_exists',
    message: 'Account already exists. Please log in instead.',
    redirectTo: '/login'
  }
}

// 3. Create new contact in GHL
const newContact = await createContact({
  email,
  firstName: name.split(' ')[0],
  lastName: name.split(' ')[1] || '',
  tags: ['siteoptz-plan-free'] // Default to free plan
})

// 4. Store password hash
await storePasswordForContact(newContact.id, password)

// 5. Assign plan tag if not free
if (plan !== 'free') {
  await assignPlanTag(newContact.id, plan)
}

// 6. Create session and redirect
return {
  success: true,
  redirectTo: `/dashboard/${plan}`
}
```

---

## 🛡️ Route Protection

### PlanProtectedRoute Component

Wraps dashboard routes to ensure users have proper access:

```javascript
// Example: Pro dashboard route
<Route path="/dashboard/pro" element={
  <PlanProtectedRoute requiredPlan="pro">
    <DashboardLayout plan="pro">
      <ProDashboard />
    </DashboardLayout>
  </PlanProtectedRoute>
} />
```

**Protection Logic:**

```javascript
const PlanProtectedRoute = ({ children, requiredPlan }) => {
  // 1. Check if authenticated
  if (!GHLAuthService.isAuthenticated()) {
    return <Navigate to="/login" />
  }

  // 2. Get user plan
  const user = GHLAuthService.getCurrentUser()

  // 3. Check if user has access (supports plan hierarchy)
  const hasAccess = GHLAuthService.hasAccessToPlan(user.plan, requiredPlan)

  // Plan hierarchy: free < starter < pro < enterprise
  // Pro user CAN access Free and Starter dashboards
  // Free user CANNOT access Pro or Enterprise

  if (!hasAccess) {
    // Redirect to user's actual dashboard
    return <Navigate to={`/dashboard/${user.plan}`} />
  }

  // 4. Grant access
  return children
}
```

---

## 🔧 Setup Instructions

### Step 1: Configure GoHighLevel

1. **Get API Credentials:**
   - Go to GHL Settings → API
   - Copy your API Key
   - Copy your Location ID

2. **Set Up OAuth App (Optional):**
   - Go to GHL Settings → OAuth Apps
   - Create new app
   - Copy Client ID and Client Secret
   - Set redirect URI: `http://localhost:3000/auth/callback`

3. **Create Plan Tags:**
   - Go to GHL Settings → Tags
   - Create these tags:
     - `siteoptz-plan-free`
     - `siteoptz-plan-starter`
     - `siteoptz-plan-pro`
     - `siteoptz-plan-enterprise`

4. **Add Custom Field (Optional):**
   - Go to GHL Settings → Custom Fields
   - Add field: `password_hash` (text)
   - This stores hashed passwords

### Step 2: Configure Environment Variables

Create `.env` file:

```bash
# GoHighLevel API
REACT_APP_GHL_API_KEY=your_api_key_here
REACT_APP_GHL_LOCATION_ID=your_location_id_here

# GoHighLevel OAuth
REACT_APP_GHL_OAUTH_CLIENT_ID=your_client_id_here
REACT_APP_GHL_OAUTH_CLIENT_SECRET=your_client_secret_here
REACT_APP_GHL_OAUTH_REDIRECT_URI=http://localhost:3000/auth/callback
```

### Step 3: Test Authentication

**Test Login (Existing User):**
1. Create a test contact in GHL
2. Add tag: `siteoptz-plan-pro`
3. Go to `/login`
4. Enter email
5. Should redirect to `/dashboard/pro`

**Test Get Started (New User):**
1. Go to `/get-started`
2. Enter new email
3. Select plan: Pro
4. Submit form
5. Should create contact in GHL with tag
6. Should redirect to `/dashboard/pro`

**Test User Exists:**
1. Create contact in GHL
2. Go to `/get-started`
3. Enter existing email
4. Should show: "Account already exists" message
5. Should offer button to go to Login

**Test User Not Found:**
1. Go to `/login`
2. Enter non-existent email
3. Should show: "No account found" message
4. Should offer button to Get Started

---

## 📝 Key Features

### ✅ Smart Routing

- Existing users trying to sign up → Redirected to login
- New users trying to login → Redirected to get started
- Users automatically routed to correct dashboard based on plan

### ✅ Plan Verification

- All checks done via GHL tags
- Plans stored in contact tags
- Easy to upgrade/downgrade via tag management

### ✅ Session Management

- User data stored in localStorage
- Auth token for session validation
- Persistent across page refreshes

### ✅ Route Protection

- All dashboard routes protected
- Plan hierarchy enforced
- Automatic redirect to appropriate dashboard

---

## 🔄 Plan Upgrade/Downgrade

When user upgrades their plan:

```javascript
// Update plan in GHL and session
await GHLAuthService.updateUserPlan('pro')

// This will:
// 1. Remove old plan tag from GHL contact
// 2. Add new plan tag: 'siteoptz-plan-pro'
// 3. Update localStorage user data
// 4. User can now access /dashboard/pro
```

---

## 🎨 UI/UX Features

### Login Form Features:
- ✅ Email/password login
- ✅ OAuth login button
- ✅ Magic link option
- ✅ "User not found" message with CTA
- ✅ Forgot password link
- ✅ Link to Get Started

### Get Started Form Features:
- ✅ Name, email, password fields
- ✅ Plan selection dropdown
- ✅ Password confirmation
- ✅ OAuth sign up button
- ✅ "User exists" message with CTA
- ✅ Link to Login

### Messages:
- 📘 Info boxes (blue) - For redirects
- ✅ Success boxes (green) - For successful actions
- ⚠️ Error boxes (red) - For errors

---

## 🐛 Debugging

### Enable Logging

Navigation logger is already included in `App.js`:

```javascript
<NavigationLogger />
```

This logs route changes in development mode.

### Check Authentication State

```javascript
// In browser console:
const user = JSON.parse(localStorage.getItem('user_data'))
console.log('Current user:', user)
console.log('Plan:', user.plan)
```

### Verify GHL Contact

```bash
# Check if contact exists with correct tags
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "https://rest.gohighlevel.com/v1/contacts/?email=test@example.com&locationId=YOUR_LOCATION_ID"
```

---

## 🚀 Production Checklist

### Security:
- [ ] Use HTTPS for all OAuth redirects
- [ ] Store passwords with bcrypt (not simple SHA-256)
- [ ] Implement rate limiting on login attempts
- [ ] Add CSRF protection
- [ ] Validate all inputs server-side
- [ ] Use secure session tokens (not timestamps)

### GHL Configuration:
- [ ] All plan tags created in GHL
- [ ] OAuth app configured with production URLs
- [ ] API keys secured in environment variables
- [ ] Custom field for password_hash created
- [ ] Webhook configured for real-time updates

### Testing:
- [ ] Test all authentication flows
- [ ] Test plan upgrades/downgrades
- [ ] Test route protection
- [ ] Test session expiration
- [ ] Test with multiple users

---

## 📚 API Reference

### GHLAuthService Methods

```javascript
// Login
await GHLAuthService.loginWithEmail(email, password)
// Returns: { success, user, redirectTo } or { success: false, error, message }

// Sign Up
await GHLAuthService.signUpWithEmail(email, password, name, plan)
// Returns: { success, user, redirectTo } or { success: false, error, message }

// OAuth
await GHLAuthService.initiateOAuth()
// Redirects to GHL OAuth consent screen

// Check Auth
GHLAuthService.isAuthenticated()
// Returns: boolean

// Get User
GHLAuthService.getCurrentUser()
// Returns: { id, email, name, plan, tags, authenticated }

// Logout
GHLAuthService.logout()
// Clears session

// Update Plan
await GHLAuthService.updateUserPlan('pro')
// Updates tags in GHL and session

// Check Access
GHLAuthService.hasAccessToPlan(userPlan, requiredPlan)
// Returns: boolean (supports hierarchy)
```

---

## 🎓 Example Scenarios

### Scenario 1: New User Signs Up

```
User → /get-started
↓
Enters: john@example.com, password, name
Selects: Pro plan
↓
System checks GHL: No contact found ✓
↓
Creates contact with tag: siteoptz-plan-pro
↓
Session created
↓
Redirects to: /dashboard/pro
```

### Scenario 2: Existing User Tries to Sign Up

```
User → /get-started
↓
Enters: existing@example.com
↓
System checks GHL: Contact found ✗
↓
Shows message: "Account already exists"
Shows button: "Go to Login"
↓
User clicks button → /login
```

### Scenario 3: New User Tries to Login

```
User → /login
↓
Enters: newuser@example.com
↓
System checks GHL: No contact found ✗
↓
Shows message: "No account found"
Shows button: "Create Account"
↓
User clicks button → /get-started
```

### Scenario 4: User Upgrades Plan

```
User on Free plan
↓
Purchases Pro plan via Stripe
↓
Webhook triggers: updateUserPlan('pro')
↓
GHL tag updated: siteoptz-plan-free → siteoptz-plan-pro
↓
Session updated
↓
User now has access to: /dashboard/pro
```

---

## 💡 Best Practices

1. **Always verify via GHL tags** - Tags are the source of truth
2. **Log authentication events** - Track login attempts and failures
3. **Handle errors gracefully** - Show helpful messages
4. **Redirect appropriately** - Guide users to the right place
5. **Secure passwords** - Use bcrypt in production
6. **Test edge cases** - What if API is down? What if tags are missing?

---

## 🆘 Troubleshooting

### "User not found" but user exists in GHL
- Check if email matches exactly (case-sensitive)
- Verify REACT_APP_GHL_LOCATION_ID is correct
- Check API key has proper permissions

### User redirected to wrong dashboard
- Check contact tags in GHL
- Verify tags match exactly: `siteoptz-plan-{plan}`
- Check for multiple plan tags on one contact

### OAuth not working
- Verify OAuth credentials in .env
- Check redirect URI matches GHL app settings
- Ensure scopes include 'contacts.readonly' and 'contacts.write'

### Session not persisting
- Check localStorage is enabled in browser
- Verify user_data is being stored
- Check for localStorage quota errors

---

**That's it!** You now have a complete authentication system integrated with GoHighLevel tags that routes users to the correct dashboard based on their plan. 🎉

