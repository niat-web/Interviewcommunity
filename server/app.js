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

// Enable CORS
app.use(cors());

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
app.use('/api/public-bookings', require('./routes/public.routes')); // ** NEW **

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
