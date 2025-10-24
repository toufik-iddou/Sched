const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const passport = require('passport');
const session = require('express-session');
const csrf = require('csurf');
// Import auth configuration to register Google strategy
const authRoutes = require('./auth');
const userRoutes = require('./routes/user');
const availabilityRoutes = require('./routes/availability');
const bookingRoutes = require('./routes/booking');


const app = express();

// Configure CORS to allow credentials and specific origins
app.use(cors({
  origin: process.env.FRONTEND_URL ,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
}));

app.use(express.json());

// Session middleware (required for passport)
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }, // set to true if using HTTPS
}));
app.use(passport.initialize());
app.use(passport.session());

// CSRF middleware configuration
const csrfProtection = csrf();

// CSRF token endpoint (apply CSRF middleware to generate token)
app.get('/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Apply CSRF protection to all routes except auth and public routes
app.use((req, res, next) => {
  // Skip CSRF for auth routes, public endpoints, and public booking endpoints
  if (req.path.startsWith('/auth/') || 
      req.path === '/csrf-token' || 
      req.path === '/test' ||
      req.path.startsWith('/booking/availability/') ||
      req.path.startsWith('/booking/slot-types/') ||
      req.path.startsWith('/booking/host/') ||
      req.path.startsWith('/booking/book/')) {
    return next();
  }
  return csrfProtection(req, res, next);
});

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.use('/test', (req,res,next)=>{
  res.send('Hello World');
});
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/availability', availabilityRoutes);
app.use('/booking', bookingRoutes);

app.get('/', (req, res) => {
  res.send('Sched API is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 