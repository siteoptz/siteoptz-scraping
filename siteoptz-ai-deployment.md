# 📦 Deploying Authentication to siteoptz-ai on Vercel

## Files to Deploy to siteoptz-ai

Since `siteoptz-ai` already has login/register forms at `/#login` and `/#register`, you need to deploy these specific files:

### 1. Authentication Logic Module
**File:** `siteoptz-ghl-auth-logic.js`
- Add to your siteoptz-ai project
- Place in `/public/js/` or `/assets/js/`
- This provides the GHL conditional logic

### 2. Proxy Server (Vercel Function)
Create this as a Vercel Function to handle CORS:

**File:** `/api/auth/[...auth].js`
```javascript
// Place this in your siteoptz-ai project at /api/auth/[...auth].js
import axios from 'axios';

const GHL_CONFIG = {
  API_KEY: process.env.GHL_API_KEY,
  LOCATION_ID: process.env.GHL_LOCATION_ID,
  BASE_URL: 'https://services.leadconnectorhq.com'
};

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://siteoptz.ai');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { auth } = req.query;
  const endpoint = auth.join('/');

  try {
    if (endpoint === 'login') {
      // Handle login
      const { email, password } = req.body;
      
      // Check if contact exists in GHL
      const ghlResponse = await axios.get(`${GHL_CONFIG.BASE_URL}/contacts/`, {
        params: { query: email, locationId: GHL_CONFIG.LOCATION_ID },
        headers: {
          'Authorization': `Bearer ${GHL_CONFIG.API_KEY}`,
          'Version': '2021-07-28'
        }
      });
      
      const contact = ghlResponse.data.contacts?.find(c => c.email === email);
      
      if (!contact) {
        return res.status(404).json({
          success: false,
          error: 'user_not_found',
          message: 'No account found with this email'
        });
      }
      
      // Extract plan from tags
      const planTags = {
        'siteoptz-plan-free': 'free',
        'siteoptz-plan-starter': 'starter',
        'siteoptz-plan-pro': 'pro',
        'siteoptz-plan-enterprise': 'enterprise'
      };
      
      let userPlan = 'free';
      if (contact.tags) {
        for (const tag of contact.tags) {
          if (planTags[tag]) {
            userPlan = planTags[tag];
            break;
          }
        }
      }
      
      return res.json({
        success: true,
        user: {
          id: contact.id,
          email: contact.email,
          name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
          plan: userPlan
        }
      });
      
    } else if (endpoint === 'register') {
      // Handle registration
      const { name, email, password, plan = 'free' } = req.body;
      
      // Check if already exists
      const checkResponse = await axios.get(`${GHL_CONFIG.BASE_URL}/contacts/`, {
        params: { query: email, locationId: GHL_CONFIG.LOCATION_ID },
        headers: {
          'Authorization': `Bearer ${GHL_CONFIG.API_KEY}`,
          'Version': '2021-07-28'
        }
      });
      
      if (checkResponse.data.contacts?.find(c => c.email === email)) {
        return res.status(409).json({
          success: false,
          error: 'user_exists',
          message: 'An account with this email already exists'
        });
      }
      
      // Create new contact
      const [firstName, ...lastNameParts] = name.split(' ');
      const createResponse = await axios.post(
        `${GHL_CONFIG.BASE_URL}/contacts/`,
        {
          firstName,
          lastName: lastNameParts.join(' '),
          email,
          locationId: GHL_CONFIG.LOCATION_ID,
          tags: [`siteoptz-plan-${plan}`]
        },
        {
          headers: {
            'Authorization': `Bearer ${GHL_CONFIG.API_KEY}`,
            'Version': '2021-07-28'
          }
        }
      );
      
      const newContact = createResponse.data.contact;
      
      return res.json({
        success: true,
        user: {
          id: newContact.id,
          email: newContact.email,
          name: name,
          plan: plan
        }
      });
    }
    
    return res.status(404).json({ error: 'Not found' });
    
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({
      success: false,
      error: 'server_error',
      message: 'An error occurred'
    });
  }
}
```

### 3. Environment Variables for Vercel

Add these to your Vercel project settings:

```bash
# Go to: https://vercel.com/siteoptzs-projects/siteoptz-ai/settings/environment-variables

GHL_API_KEY=pit-8954f181-e668-4613-80d6-c7b4aa8594b8
GHL_LOCATION_ID=ECu5ScdYFmB0WnhvYoBU
```

### 4. Update Your Existing Forms

In your siteoptz-ai project, update your login/register handlers:

```javascript
// Update your existing login handler
async function handleLogin(email, password) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  if (data.success) {
    // Store user and redirect to dashboard
    localStorage.setItem('user', JSON.stringify(data.user));
    window.location.href = `https://optz.siteoptz.ai/dashboard/${data.user.plan}`;
  } else if (data.error === 'user_not_found') {
    // Show "No account found" message
    showError('No account found. Please create an account.');
    // Add button to go to register
    showActionButton('Create Account', () => {
      window.location.hash = '#register';
    });
  }
}

// Update your existing register handler
async function handleRegister(name, email, password, plan) {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, plan })
  });
  
  const data = await response.json();
  
  if (data.success) {
    // Store user and redirect to dashboard
    localStorage.setItem('user', JSON.stringify(data.user));
    window.location.href = `https://optz.siteoptz.ai/dashboard/${data.user.plan}`;
  } else if (data.error === 'user_exists') {
    // Show "Account exists" message
    showError('An account already exists. Please log in.');
    // Add button to go to login
    showActionButton('Go to Login', () => {
      window.location.hash = '#login';
    });
  }
}
```

## 🚀 Deployment Steps

1. **Add environment variables to Vercel:**
   ```bash
   vercel env add GHL_API_KEY production
   vercel env add GHL_LOCATION_ID production
   ```

2. **Deploy to siteoptz-ai:**
   ```bash
   # Switch to siteoptz-ai project
   vercel link --project siteoptz-ai
   
   # Deploy
   vercel --prod
   ```

3. **Or deploy via Git:**
   - Push the changes to the siteoptz-ai repository
   - Vercel will auto-deploy

## 🧪 Testing After Deployment

1. **Test Login Flow:**
   - Go to https://siteoptz.ai/#login
   - Try with non-existent email
   - Should show "No account found"

2. **Test Register Flow:**
   - Go to https://siteoptz.ai/#register  
   - Try with existing email
   - Should show "Account exists"

3. **Verify Dashboard Redirects:**
   - Login with test account
   - Should redirect to: https://optz.siteoptz.ai/dashboard/{plan}

## 📝 Important Notes

- The Vercel Function handles CORS automatically
- User sessions stored in localStorage
- Plan tags determine dashboard access
- All API calls go through `/api/auth/*` endpoints

## 🔗 URLs After Deployment

- Main site: https://siteoptz.ai
- Login: https://siteoptz.ai/#login
- Register: https://siteoptz.ai/#register
- API: https://siteoptz.ai/api/auth/login
- Dashboard: https://optz.siteoptz.ai/dashboard/{plan}