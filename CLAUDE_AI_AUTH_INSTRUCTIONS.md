# 🤖 Claude AI Authentication Instructions

## Clear Instructions for Implementing GHL Auth

Hey Claude! Here's exactly what this authentication system does and how to help users with it:

---

## 🎯 What This System Does

**Simple Version:**
- Users can log in or create accounts
- Their account info is stored in GoHighLevel (GHL)
- GHL tags determine which dashboard they see
- System automatically routes users to: `/dashboard/free`, `/dashboard/starter`, `/dashboard/pro`, or `/dashboard/enterprise`

---

## 📋 The Core Logic

### 1. **Login Flow (Existing Users)**

```
IF user tries to LOGIN:
  → Check if email exists in GHL
  
  IF email NOT found:
    ❌ Show message: "No account found with this email"
    📍 Action: Redirect to /get-started
    
  IF email found:
    → Verify password
    → Check GHL tags for plan:
      - siteoptz-plan-free → /dashboard/free
      - siteoptz-plan-starter → /dashboard/starter
      - siteoptz-plan-pro → /dashboard/pro
      - siteoptz-plan-enterprise → /dashboard/enterprise
    → Redirect to correct dashboard
```

### 2. **Sign Up Flow (New Users)**

```
IF user tries to GET STARTED (sign up):
  → Check if email already exists in GHL
  
  IF email EXISTS:
    ❌ Show message: "Account already exists"
    📍 Action: Redirect to /login
    
  IF email does NOT exist:
    → Create new contact in GHL
    → Add tag: siteoptz-plan-{selected_plan}
    → Store password (hashed)
    → Create session
    → Redirect to /dashboard/{plan}
```

---

## 🔑 Key Files & Their Purpose

### `src/services/GHLAuthService.js`
**What it does:** Handles all authentication logic
- `loginWithEmail()` - Checks if user exists, verifies password
- `signUpWithEmail()` - Creates new user in GHL
- `findContactByEmail()` - Searches GHL for contact
- `extractPlanFromContact()` - Reads plan tags
- `assignPlanTag()` - Updates user plan

### `src/components/LoginForm.js`
**What it does:** Login page UI
- Email/password form
- Shows "user not found" message if needed
- Redirects to Get Started if user doesn't exist

### `src/components/GetStartedForm.js`
**What it does:** Sign up page UI
- Name, email, password, plan selection
- Shows "user exists" message if needed
- Redirects to Login if user already exists

### `src/components/PlanProtectedRoute.js`
**What it does:** Protects dashboard routes
- Checks if user is authenticated
- Verifies user has access to requested plan
- Redirects to correct dashboard if wrong plan

---

## 🏷️ GoHighLevel Tags (Source of Truth)

These tags in GHL determine everything:

```javascript
{
  free: 'siteoptz-plan-free',
  starter: 'siteoptz-plan-starter', 
  pro: 'siteoptz-plan-pro',
  enterprise: 'siteoptz-plan-enterprise'
}
```

**How to use:**
1. User signs up → Contact created in GHL with tag
2. System checks tag → Routes to dashboard
3. User upgrades → Tag updated → New dashboard access

---

## 🛠️ Setup for Users

### Step 1: GHL Configuration

Tell users to:

1. **Get GHL API Key:**
   ```
   GHL → Settings → API → Copy API Key
   ```

2. **Get Location ID:**
   ```
   GHL → Settings → Account → Copy Location ID
   ```

3. **Create Tags in GHL:**
   ```
   GHL → Settings → Tags → Create:
   - siteoptz-plan-free
   - siteoptz-plan-starter
   - siteoptz-plan-pro
   - siteoptz-plan-enterprise
   ```

4. **Add to .env file:**
   ```bash
   REACT_APP_GHL_API_KEY=ghl_api_key_here
   REACT_APP_GHL_LOCATION_ID=location_id_here
   ```

### Step 2: Test It

**Test Login (Existing User):**
```bash
1. Manually create a contact in GHL
2. Add tag: siteoptz-plan-pro
3. Go to http://localhost:3000/login
4. Enter that contact's email
5. Should redirect to /dashboard/pro
```

**Test Get Started (New User):**
```bash
1. Go to http://localhost:3000/get-started
2. Enter new email (not in GHL)
3. Select plan: Pro
4. Submit
5. Check GHL → Contact created with tag
6. Should redirect to /dashboard/pro
```

**Test "User Exists" Message:**
```bash
1. Create contact in GHL first
2. Go to /get-started
3. Enter that email
4. Should show: "Account already exists. Please log in."
5. Button shown: "Go to Login"
```

**Test "User Not Found" Message:**
```bash
1. Go to /login
2. Enter email that doesn't exist in GHL
3. Should show: "No account found. Please create an account."
4. Button shown: "Create Account"
```

---

## 💬 Common User Questions & Answers

### Q: "Where is the user data stored?"
**A:** User data is stored in GoHighLevel contacts. Tags determine their plan level.

### Q: "How do I upgrade a user's plan?"
**A:** Update their GHL tag from `siteoptz-plan-free` to `siteoptz-plan-pro` (for example). They'll automatically get access to the Pro dashboard.

### Q: "What if GHL API is down?"
**A:** The login will fail gracefully with an error message. User data won't be lost.

### Q: "Do I need to set up OAuth?"
**A:** OAuth is optional. Email/password works fine. OAuth is for "Sign in with GoHighLevel" button.

### Q: "How secure is password storage?"
**A:** Passwords are hashed using SHA-256 (simple version). For production, upgrade to bcrypt.

### Q: "Can users have multiple plan tags?"
**A:** No. System removes old plan tag when assigning new one. Only one plan per user.

### Q: "How do I manually test a login?"
**A:** 
```javascript
// In browser console:
const result = await GHLAuthService.loginWithEmail('test@example.com', 'password123')
console.log(result)
```

---

## 🐛 Debugging Guide

### Issue: "User not found" but they exist in GHL

**Check:**
```javascript
// 1. Verify email matches exactly
console.log('Email in form:', email)
console.log('Email in GHL:', ghlContact.email)

// 2. Check Location ID is correct
console.log('Location ID:', process.env.REACT_APP_GHL_LOCATION_ID)

// 3. Test API directly
const contact = await GHLAuthService.findContactByEmail('test@example.com')
console.log('Found contact:', contact)
```

### Issue: User redirected to wrong dashboard

**Check:**
```javascript
// 1. Check contact tags in GHL
console.log('Contact tags:', contact.tags)

// 2. Verify tag extraction
const plan = GHLAuthService.extractPlanFromContact(contact)
console.log('Extracted plan:', plan)

// 3. Check for multiple plan tags
const planTags = contact.tags.filter(t => t.includes('siteoptz-plan-'))
console.log('Plan tags found:', planTags) // Should be 1, not multiple
```

### Issue: Session not persisting

**Check:**
```javascript
// Check localStorage
const userData = localStorage.getItem('user_data')
console.log('Stored user:', JSON.parse(userData))

// Check if authenticated
const isAuth = GHLAuthService.isAuthenticated()
console.log('Is authenticated:', isAuth)
```

---

## 📝 Code Examples

### Creating a User Manually (for testing)

```javascript
// In browser console or testing:
const result = await GHLAuthService.signUpWithEmail(
  'test@example.com',
  'password123',
  'Test User',
  'pro'
)

console.log('Result:', result)
// Should create contact in GHL with tag: siteoptz-plan-pro
```

### Checking User Plan

```javascript
const user = GHLAuthService.getCurrentUser()
console.log('Current plan:', user.plan)
console.log('Has access to Pro?', GHLAuthService.hasAccessToPlan(user.plan, 'pro'))
```

### Updating User Plan

```javascript
// Upgrade user to Pro
await GHLAuthService.updateUserPlan('pro')

// This will:
// 1. Remove old tag in GHL
// 2. Add 'siteoptz-plan-pro' tag
// 3. Update local session
```

---

## 🎨 UI Messages

### Success Message (Green Box)
```javascript
{
  type: 'success',
  title: 'Welcome!',
  text: 'Account created successfully.'
}
```

### Info Message (Blue Box)
```javascript
{
  type: 'info',
  title: 'Account Already Exists',
  text: 'Please log in instead.',
  action: {
    label: 'Go to Login',
    onClick: () => navigate('/login')
  }
}
```

### Error Message (Red Box)
```javascript
{
  type: 'error',
  title: 'Login Failed',
  text: 'Please check your credentials.'
}
```

---

## ✅ Production Checklist

When user asks "Is this ready for production?", check:

- [ ] GHL API key configured
- [ ] All 4 plan tags created in GHL
- [ ] Password hashing upgraded to bcrypt
- [ ] HTTPS enabled for OAuth
- [ ] Rate limiting on login attempts
- [ ] Session timeout implemented
- [ ] Error logging set up
- [ ] Tested all authentication flows
- [ ] Tested plan upgrades/downgrades
- [ ] Tested route protection

---

## 🚀 Quick Commands

### Start the app:
```bash
npm start
```

### Test login:
```bash
# Go to: http://localhost:3000/login
```

### Test signup:
```bash
# Go to: http://localhost:3000/get-started
```

### Check GHL contacts:
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "https://rest.gohighlevel.com/v1/contacts/?locationId=YOUR_LOCATION_ID"
```

---

## 💡 Claude's Role

When users ask you questions about this system, you should:

1. **Explain the flow** - Use the flowcharts above
2. **Check the files** - Reference the key files section
3. **Debug issues** - Use the debugging guide
4. **Test scenarios** - Walk through the test cases
5. **Verify setup** - Confirm GHL tags and .env values

**Remember:** The GHL tags are the source of truth. Everything else follows from those tags.

---

## 📞 Common Support Requests

### "It's not working"
Ask:
- Did you add GHL API key to .env?
- Did you create the 4 plan tags in GHL?
- Did you restart the app after adding .env?
- What error do you see in browser console?

### "User can't log in"
Ask:
- Does the contact exist in GHL?
- Does the contact have a plan tag?
- Is the email exactly the same?
- Check browser console for errors

### "Wrong dashboard showing"
Ask:
- What plan tag does the contact have in GHL?
- Check: GHL → Contacts → Select Contact → Tags tab
- Should have exactly ONE of the 4 plan tags

---

**That's everything!** This authentication system routes users based on GHL tags to the correct dashboard. The logic is straightforward: check email → verify against GHL → extract plan tag → redirect to /dashboard/{plan}. 

Easy! 🎉

