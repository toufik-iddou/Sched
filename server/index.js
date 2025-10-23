const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const passport = require('passport');
const session = require('express-session');
// Import auth configuration to register Google strategy
const authRoutes = require('./auth');
const userRoutes = require('./routes/user');
const availabilityRoutes = require('./routes/availability');
const bookingRoutes = require('./routes/booking');


const app = express();

// Configure CORS to allow credentials and specific origins
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
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