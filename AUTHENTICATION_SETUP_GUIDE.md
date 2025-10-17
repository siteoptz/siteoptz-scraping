# SiteOptz.ai Authentication System Setup Guide

## Quick Start

The authentication system is fully implemented and ready to use. Follow these steps to get it running:

## 1. GoHighLevel Configuration

### Step 1: Get Your API Credentials

1. **API Key:**
   - Log into GoHighLevel
   - Go to Settings → Business Profile → API Keys
   - Click "Create API Key"
   - Name it "SiteOptz Authentication"
   - Copy the API key

2. **Location ID:**
   - In GoHighLevel, go to Settings → Business Profile
   - Copy your Location ID (also called Sub-account ID)

### Step 2: Create Required Tags in GoHighLevel

You MUST create these exact tags in your GoHighLevel account:

1. Go to Settings → Tags
2. Create these 4 tags (exactly as shown):
   - `siteoptz-plan-free`
   - `siteoptz-plan-starter`
   - `siteoptz-plan-pro`
   - `siteoptz-plan-enterprise`

### Step 3: Configure Your Environment

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Add your GoHighLevel credentials to `.env`:
```
REACT_APP_GHL_API_KEY=your_actual_ghl_api_key_here
REACT_APP_GHL_LOCATION_ID=your_actual_location_id_here
```

## 2. Start the Application

```bash
npm install
npm start
```

The app will run on http://localhost:3000

## 3. Authentication Flow

### User Journey

1. **New Users:**
   - Go to `/get-started`
   - Enter name, email, password
   - Select plan (Free, Starter, Pro, Enterprise)
   - System creates contact in GHL with appropriate tag
   - User is redirected to their dashboard

2. **Existing Users:**
   - Go to `/login`
   - Enter email and password
   - System verifies contact exists in GHL
   - Checks plan tag and redirects to appropriate dashboard

3. **Plan-Based Access:**
   - Free users: `/dashboard/free`
   - Starter users: `/dashboard/starter`
   - Pro users: `/dashboard/pro`
   - Enterprise users: `/dashboard/enterprise`

## 4. Testing the System

### Test Case 1: New User Registration

1. Go to http://localhost:3000/get-started
2. Fill in:
   - Name: Test User
   - Email: test@example.com
   - Password: test123
   - Plan: Pro
3. Click "Create Account"
4. Verify:
   - Contact created in GoHighLevel
   - Tag `siteoptz-plan-pro` assigned
   - Redirected to `/dashboard/pro`

### Test Case 2: Existing User Login

1. Create a contact manually in GoHighLevel:
   - Email: existing@example.com
   - Add tag: `siteoptz-plan-starter`
2. Go to http://localhost:3000/login
3. Enter email: existing@example.com
4. Enter any password (development mode accepts any 6+ char password)
5. Verify redirected to `/dashboard/starter`

### Test Case 3: User Not Found

1. Go to http://localhost:3000/login
2. Enter email: nonexistent@example.com
3. Verify:
   - Message: "No account found with this email address"
   - Button: "Create Account" (redirects to /get-started)

### Test Case 4: User Already Exists

1. Create contact in GHL with email: duplicate@example.com
2. Go to http://localhost:3000/get-started
3. Try to register with same email
4. Verify:
   - Message: "An account with this email already exists"
   - Button: "Go to Login" (redirects to /login)

### Test Case 5: Plan Protection

1. Login as a free user
2. Try to access `/dashboard/pro` directly
3. Verify redirected back to `/dashboard/free`

## 5. How the System Works

### Core Components

1. **GHLAuthService.js** (`src/services/GHLAuthService.js`)
   - Handles all GoHighLevel API calls
   - Manages user authentication
   - Controls plan tags

2. **LoginForm.js** (`src/components/LoginForm.js`)
   - Login interface
   - Shows appropriate messages for non-existent users

3. **GetStartedForm.js** (`src/components/GetStartedForm.js`)
   - Registration interface
   - Shows appropriate messages for existing users

4. **PlanProtectedRoute.js** (`src/components/PlanProtectedRoute.js`)
   - Protects dashboard routes
   - Ensures users only access their plan level

### Data Flow

```
User Signs Up → Create GHL Contact → Assign Plan Tag → Store Session → Redirect to Dashboard
User Logs In → Find GHL Contact → Read Plan Tag → Store Session → Redirect to Dashboard
```

## 6. Security Notes

### Development Mode
- Password verification is simplified (any 6+ character password works)
- Passwords are hashed with SHA-256 (basic security)

### Production Requirements
Before going live, you should:
1. Implement proper password verification with bcrypt
2. Use HTTPS for all API calls
3. Add rate limiting on login attempts
4. Implement session timeouts
5. Add CSRF protection
6. Consider implementing 2FA

## 7. Troubleshooting

### "Go High Level API is not configured"
- Check your `.env` file has the correct API key and Location ID
- Ensure no quotes around the values
- Restart the development server after changing `.env`

### "User not found" but they exist in GHL
- Verify the Location ID matches your GoHighLevel sub-account
- Check the email matches exactly (case-insensitive)
- Ensure the API key has proper permissions

### User redirected to wrong dashboard
- Check the contact's tags in GoHighLevel
- Ensure they have exactly ONE plan tag
- Remove any duplicate plan tags

### Cannot create new users
- Verify API key has write permissions
- Check network connectivity to GoHighLevel API
- Look for errors in browser console

## 8. API Endpoints Used

The system uses these GoHighLevel API endpoints:

- `GET /v1/contacts/` - Find contacts by email
- `POST /v1/contacts/` - Create new contacts
- `POST /v1/contacts/{id}/tags` - Add tags to contacts
- `DELETE /v1/contacts/{id}/tags` - Remove tags from contacts
- `PUT /v1/contacts/{id}` - Update contact custom fields

## 9. Testing in Browser Console

You can test the authentication service directly:

```javascript
// Test login
const result = await GHLAuthService.loginWithEmail('test@example.com', 'password123')
console.log(result)

// Test signup
const signup = await GHLAuthService.signUpWithEmail(
  'new@example.com',
  'password123',
  'New User',
  'pro'
)
console.log(signup)

// Check current user
const user = GHLAuthService.getCurrentUser()
console.log(user)

// Check authentication status
console.log('Authenticated?', GHLAuthService.isAuthenticated())
```

## 10. Plan Upgrade/Downgrade

To change a user's plan:

1. **Manual Method:**
   - Go to GoHighLevel → Contacts
   - Find the contact
   - Remove old plan tag
   - Add new plan tag

2. **Programmatic Method:**
```javascript
await GHLAuthService.updateUserPlan('pro')
```

## Support

If you encounter issues:

1. Check browser console for errors
2. Verify GoHighLevel API status
3. Ensure all environment variables are set
4. Check network tab for API call failures

## Next Steps

Once authentication is working:

1. Customize the dashboard pages for each plan
2. Add payment integration for plan upgrades
3. Implement email verification
4. Add password reset functionality
5. Set up automated onboarding workflows in GoHighLevel

---

**Ready to test?** Start with Test Case 1 above and work through each scenario to verify everything is working correctly!