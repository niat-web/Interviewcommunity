// server/app.js
const express = require('express');
const dotenv = require('dotenv');
const colors = require('colors');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { errorHandler, notFound } = require('./middleware/error.middleware');
const { requestLogger } = require('./middleware/logger.middleware');

// Load env vars
dotenv.config();

// Initialize Express
const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


// ====================================================================
// ========== START: ROBUST CORS CONFIGURATION ========================
// ====================================================================

// Whitelist of allowed domains. Reads your CLIENT_URL from Render's environment variables.
const allowedOrigins = [
  process.env.CLIENT_URL, // e.g., https://interviewcommunity.vercel.app
  'http://localhost:3000'   // For your local development
];

const corsOptions = {
  origin: (origin, callback) => {
    // The 'origin' is the URL of the site making the request (e.g., your Vercel URL).
    // The check '!origin' allows server-to-server requests or tools like Postman to work.
    if (!origin || allowedOrigins.includes(origin)) {
      // If the origin is in our whitelist (or it's not a browser request), allow it.
      callback(null, true);
    } else {
      // If the origin is not in the whitelist, block it.
      callback(new Error('This request was blocked by CORS.'));
    }
  },
  credentials: true,       // Allows cookies or authorization headers to be sent
  optionsSuccessStatus: 200 // For older browsers that may have issues with 204 status
};

// Vercel/browsers send a "pre-flight" OPTIONS request before the actual POST/GET request
// to check if the server will allow it. This line ensures we respond to those checks.
app.options('*', cors(corsOptions));

// This line applies our CORS rules to all actual requests (GET, POST, PUT, DELETE, etc.).
app.use(cors(corsOptions));

// ====================================================================
// ========== END: ROBUST CORS CONFIGURATION ==========================
// ====================================================================


// Request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(requestLogger);

// Set static folder for email templates preview if needed
app.use('/templates', express.static(path.join(__dirname, 'templates')));

// Mount routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/applicant', require('./routes/applicant.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/interviewer', require('./routes/interviewer.routes'));
app.use('/api/public-bookings', require('./routes/public.routes'));

// Basic route for API health check
app.get('/', (req, res) => {
  res.json({
    message: 'NxtWave Interviewer API is running',
    version: '1.0.0',
    environment: process.env.NODE_ENV
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
