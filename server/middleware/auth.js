const jwt = require('jsonwebtoken');

// Middleware to verify JWT from cookies and attach user to req
function authenticateJWT(req, res, next) {
  const token = req.cookies.authToken;
  
  if (!token) {
    return res.status(401).json({ message: 'No authentication token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    // Clear invalid token
    res.clearCookie('authToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// Optional authentication middleware (doesn't fail if no token)
function optionalAuth(req, res, next) {
  const token = req.cookies.authToken;
  
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.id;
    } catch (err) {
      // Clear invalid token but don't fail
      res.clearCookie('authToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });
    }
  }
  
  next();
}

module.exports = {
  authenticateJWT,
  optionalAuth
};
