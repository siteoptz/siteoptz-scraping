/**
 * SiteOptz Authentication Proxy Server
 * 
 * This Node.js server acts as a proxy between your siteoptz.ai website
 * and the GoHighLevel API to handle CORS issues
 * 
 * Deploy this on your server or use a service like Vercel/Netlify Functions
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;

// Configuration
const CONFIG = {
  GHL_API_KEY: process.env.GHL_API_KEY || 'pit-8954f181-e668-4613-80d6-c7b4aa8594b8',
  GHL_LOCATION_ID: process.env.GHL_LOCATION_ID || 'ECu5ScdYFmB0WnhvYoBU',
  GHL_BASE_URL: 'https://services.leadconnectorhq.com',
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-this',
  ALLOWED_ORIGINS: [
    'https://siteoptz.ai',
    'https://www.siteoptz.ai',
    'https://optz.siteoptz.ai',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:5500' // For local testing
  ]
};

// Middleware
app.use(express.json());
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (CONFIG.ALLOWED_ORIGINS.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Helper function to generate JWT
function generateToken(userId, email, plan) {
  const payload = {
    id: userId,
    email: email,
    plan: plan,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };
  
  // Simple JWT implementation (use jsonwebtoken in production)
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64');
  const signature = crypto
    .createHmac('sha256', CONFIG.JWT_SECRET)
    .update(`${header}.${payloadBase64}`)
    .digest('base64');
  
  return `${header}.${payloadBase64}.${signature}`;
}

// Helper function to hash password
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Login endpoint
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }
    
    // Find contact in GoHighLevel
    const ghlResponse = await axios.get(`${CONFIG.GHL_BASE_URL}/contacts/`, {
      params: {
        query: email,
        locationId: CONFIG.GHL_LOCATION_ID
      },
      headers: {
        'Authorization': `Bearer ${CONFIG.GHL_API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      }
    });
    
    const contacts = ghlResponse.data.contacts || [];
    const contact = contacts.find(c => c.email === email);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'user_not_found',
        message: 'No account found with this email'
      });
    }
    
    // Verify password (simplified for demo)
    // In production, compare with stored hash
    const storedHash = contact.customFields?.password_hash;
    const inputHash = hashPassword(password);
    
    // For development, allow any 6+ char password if no hash stored
    const passwordValid = storedHash ? (inputHash === storedHash) : (password.length >= 6);
    
    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        error: 'invalid_password',
        message: 'Invalid password'
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
    
    // Generate token
    const token = generateToken(contact.id, contact.email, userPlan);
    
    res.json({
      success: true,
      token: token,
      user: {
        id: contact.id,
        email: contact.email,
        name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
        plan: userPlan
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'server_error',
      message: 'An error occurred during login'
    });
  }
});

/**
 * Register endpoint
 */
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, plan = 'free' } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    // Check if contact already exists
    const checkResponse = await axios.get(`${CONFIG.GHL_BASE_URL}/contacts/`, {
      params: {
        query: email,
        locationId: CONFIG.GHL_LOCATION_ID
      },
      headers: {
        'Authorization': `Bearer ${CONFIG.GHL_API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      }
    });
    
    const existingContacts = checkResponse.data.contacts || [];
    const existingContact = existingContacts.find(c => c.email === email);
    
    if (existingContact) {
      return res.status(409).json({
        success: false,
        error: 'user_exists',
        message: 'An account with this email already exists'
      });
    }
    
    // Create new contact in GoHighLevel
    const planTag = `siteoptz-plan-${plan}`;
    const [firstName, ...lastNameParts] = name.split(' ');
    const lastName = lastNameParts.join(' ');
    
    const createResponse = await axios.post(
      `${CONFIG.GHL_BASE_URL}/contacts/`,
      {
        firstName: firstName,
        lastName: lastName,
        email: email,
        locationId: CONFIG.GHL_LOCATION_ID,
        tags: [planTag],
        customFields: {
          password_hash: hashPassword(password),
          registration_date: new Date().toISOString(),
          plan: plan
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${CONFIG.GHL_API_KEY}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        }
      }
    );
    
    const newContact = createResponse.data.contact;
    
    // Generate token
    const token = generateToken(newContact.id, newContact.email, plan);
    
    res.json({
      success: true,
      token: token,
      user: {
        id: newContact.id,
        email: newContact.email,
        name: name,
        plan: plan
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error.response?.data || error);
    res.status(500).json({
      success: false,
      error: 'server_error',
      message: 'An error occurred during registration'
    });
  }
});

/**
 * Verify token endpoint
 */
app.post('/api/auth/verify', (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token required'
      });
    }
    
    // Verify token (simplified)
    const [header, payload, signature] = token.split('.');
    const expectedSignature = crypto
      .createHmac('sha256', CONFIG.JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64');
    
    if (signature !== expectedSignature) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
    
    const userData = JSON.parse(Buffer.from(payload, 'base64').toString());
    
    // Check expiration
    if (userData.exp < Math.floor(Date.now() / 1000)) {
      return res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    }
    
    res.json({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        plan: userData.plan
      }
    });
    
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
});

/**
 * Update user plan endpoint
 */
app.post('/api/auth/update-plan', async (req, res) => {
  try {
    const { userId, newPlan, token } = req.body;
    
    // Verify token first
    // ... (token verification logic)
    
    // Remove old plan tags and add new one
    const oldTags = [
      'siteoptz-plan-free',
      'siteoptz-plan-starter',
      'siteoptz-plan-pro',
      'siteoptz-plan-enterprise'
    ];
    
    const newTag = `siteoptz-plan-${newPlan}`;
    
    // Update contact tags in GoHighLevel
    // First remove old tags
    await axios.delete(
      `${CONFIG.GHL_BASE_URL}/contacts/${userId}/tags`,
      {
        data: { tags: oldTags },
        headers: {
          'Authorization': `Bearer ${CONFIG.GHL_API_KEY}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        }
      }
    );
    
    // Then add new tag
    await axios.post(
      `${CONFIG.GHL_BASE_URL}/contacts/${userId}/tags`,
      { tags: [newTag] },
      {
        headers: {
          'Authorization': `Bearer ${CONFIG.GHL_API_KEY}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        }
      }
    );
    
    res.json({
      success: true,
      message: 'Plan updated successfully',
      newPlan: newPlan
    });
    
  } catch (error) {
    console.error('Plan update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update plan'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'SiteOptz Authentication Proxy',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SiteOptz Auth Proxy running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`   Login endpoint: http://localhost:${PORT}/api/auth/login`);
  console.log(`   Register endpoint: http://localhost:${PORT}/api/auth/register`);
});