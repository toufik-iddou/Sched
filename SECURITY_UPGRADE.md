# Security Upgrade: Cookie-Based Authentication with CSRF Protection

## Overview

This upgrade transforms the application from localStorage-based JWT authentication to a secure cookie-based system with comprehensive security measures including CSRF protection, rate limiting, and proper CORS configuration.

## Key Security Improvements

### 1. Cookie-Based Authentication
- **Before**: JWT tokens stored in localStorage (vulnerable to XSS)
- **After**: JWT tokens stored in httpOnly cookies (XSS-resistant)
- **Benefits**: 
  - Tokens inaccessible to JavaScript
  - Automatic token transmission with requests
  - Better security against XSS attacks

### 2. CSRF Protection
- **Implementation**: Double-submit cookie pattern using `csrf-csrf` library
- **Coverage**: All non-GET requests require CSRF tokens
- **Configuration**: 
  - CSRF tokens automatically generated and validated
  - Tokens included in `X-CSRF-Token` header
  - Automatic token refresh on validation failures

### 3. Rate Limiting
- **Configuration**: 100 requests per 15 minutes per IP address
- **Protection**: Prevents brute force attacks and API abuse
- **Implementation**: Express rate limiting middleware

### 4. Security Headers (Helmet)
- **Content Security Policy**: Restricts resource loading
- **XSS Protection**: Additional XSS prevention headers
- **Frame Options**: Prevents clickjacking attacks
- **Content Type Options**: Prevents MIME type sniffing

### 5. CORS Configuration
- **Origin Restriction**: Only allows requests from configured frontend URL
- **Credentials Support**: Enables cookie transmission across domains
- **Method Restrictions**: Limits allowed HTTP methods
- **Header Restrictions**: Controls allowed request headers

### 6. Session Security
- **HttpOnly Cookies**: Prevents JavaScript access
- **Secure Flag**: Enabled in production (HTTPS required)
- **SameSite**: Strict policy prevents CSRF attacks
- **Custom Session Name**: Changes default session cookie name

## Technical Implementation

### Server-Side Changes

#### 1. New Dependencies
```json
{
  "cookie-parser": "^1.4.6",
  "csrf-csrf": "^2.3.0",
  "helmet": "^7.1.0",
  "express-rate-limit": "^7.1.5"
}
```

#### 2. Authentication Flow
```javascript
// OAuth callback now sets secure cookie
res.cookie('authToken', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/'
});
```

#### 3. CSRF Protection
```javascript
// CSRF token generation
app.get('/api/csrf-token', (req, res) => {
  const token = generateToken(req, res);
  res.json({ csrfToken: token });
});

// CSRF validation on all non-GET requests
app.use('/api', doubleCsrfProtection);
```

#### 4. Authentication Middleware
```javascript
// Updated to read from cookies instead of headers
function authenticateJWT(req, res, next) {
  const token = req.cookies.authToken;
  // ... validation logic
}
```

### Client-Side Changes

#### 1. API Service
```typescript
// Axios configuration with credentials
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Enables cookie transmission
  headers: {
    'Content-Type': 'application/json',
  },
});

// CSRF token management
api.interceptors.request.use(async (config) => {
  if (config.method !== 'get' && !config.url?.startsWith('/auth/')) {
    const token = await getCsrfToken();
    config.headers['X-CSRF-Token'] = token;
  }
  return config;
});
```

#### 2. Authentication Functions
```typescript
// Cookie-based auth status check
export const checkAuthStatus = async () => {
  const response = await api.get('/auth/status');
  return response.data;
};

// Logout with cookie clearing
export const logout = async () => {
  await api.post('/auth/logout');
  window.location.href = '/login';
};
```

## Environment Configuration

### Required Environment Variables
```env
# Security Secrets
JWT_SECRET=your-super-secure-jwt-secret-key
SESSION_SECRET=your-super-secure-session-secret-key
CSRF_SECRET=your-super-secure-csrf-secret-key
COOKIE_SECRET=your-super-secure-cookie-secret-key

# Application URLs
FRONTEND_URL=http://localhost:3000
NODE_ENV=development

# Updated OAuth URLs
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
```

## Security Benefits

### 1. XSS Protection
- **Before**: Tokens accessible via JavaScript (XSS vulnerable)
- **After**: Tokens in httpOnly cookies (XSS resistant)

### 2. CSRF Protection
- **Before**: No CSRF protection
- **After**: Double-submit cookie pattern with automatic validation

### 3. Session Security
- **Before**: Basic session configuration
- **After**: Secure session with proper cookie flags

### 4. API Security
- **Before**: No rate limiting
- **After**: Rate limiting prevents abuse

### 5. Header Security
- **Before**: No security headers
- **After**: Comprehensive security headers via Helmet

## Migration Guide

### For Developers

1. **Update Environment Variables**
   - Copy from `server/env.example`
   - Generate strong secrets for all security keys
   - Update OAuth redirect URIs

2. **Install New Dependencies**
   ```bash
   cd server
   npm install cookie-parser csrf-csrf helmet express-rate-limit
   ```

3. **Update Frontend Configuration**
   - Ensure `withCredentials: true` in axios
   - Update API endpoints to use `/api/` prefix
   - Remove localStorage token handling

4. **Test Authentication Flow**
   - Verify OAuth login works
   - Check CSRF token generation
   - Test logout functionality

### For Production Deployment

1. **Set Production Environment**
   ```env
   NODE_ENV=production
   FRONTEND_URL=https://yourdomain.com
   ```

2. **Enable HTTPS**
   - All cookies will automatically use `secure: true`
   - CORS will require HTTPS origins

3. **Generate Strong Secrets**
   - Use cryptographically strong random strings
   - Keep secrets separate and secure

4. **Monitor Security**
   - Watch for CSRF validation failures
   - Monitor rate limiting hits
   - Check security headers

## Testing Security Features

### 1. CSRF Protection Test
```bash
# Should fail without CSRF token
curl -X POST http://localhost:5000/api/availability \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'

# Should work with CSRF token
curl -X GET http://localhost:5000/api/csrf-token
# Then use the returned token in subsequent requests
```

### 2. Authentication Test
```bash
# Should return 401 without auth cookie
curl http://localhost:5000/api/user/me

# Should work with valid auth cookie
curl -b "authToken=valid-token" http://localhost:5000/api/user/me
```

### 3. Rate Limiting Test
```bash
# Make 100+ requests quickly to test rate limiting
for i in {1..110}; do
  curl http://localhost:5000/api/health
done
```

## Troubleshooting

### Common Issues

1. **CSRF Token Errors**
   - Check CSRF secret configuration
   - Verify token is sent in correct header
   - Ensure token endpoint is accessible

2. **Authentication Failures**
   - Verify cookie configuration
   - Check CORS settings
   - Ensure `withCredentials: true` is set

3. **CORS Errors**
   - Verify FRONTEND_URL matches actual frontend URL
   - Check credentials configuration
   - Ensure proper origin handling

4. **Cookie Issues**
   - Check domain and path settings
   - Verify secure flag in production
   - Ensure SameSite configuration

## Security Best Practices

1. **Regular Security Audits**
   - Review security headers
   - Check for new vulnerabilities
   - Update dependencies regularly

2. **Monitoring**
   - Log authentication failures
   - Monitor CSRF validation errors
   - Track rate limiting events

3. **Secret Management**
   - Rotate secrets regularly
   - Use environment-specific secrets
   - Never commit secrets to version control

4. **HTTPS Enforcement**
   - Always use HTTPS in production
   - Redirect HTTP to HTTPS
   - Use HSTS headers

This security upgrade significantly improves the application's security posture while maintaining the same user experience and functionality.
