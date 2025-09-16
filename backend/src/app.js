const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const csvController = require('./controllers/csvController');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files (for serving uploaded files if needed)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve React build files in production
if (process.env.NODE_ENV === 'production') {
  const frontendBuildPath = path.join(__dirname, '../../frontend/build');
  const indexHtmlPath = path.join(frontendBuildPath, 'index.html');
  
  // Check if frontend build exists
  const fs = require('fs');
  if (fs.existsSync(frontendBuildPath) && fs.existsSync(indexHtmlPath)) {
    app.use(express.static(frontendBuildPath));
    
    // Catch all handler for React Router
    app.get('*', (req, res, next) => {
      // Skip API routes
      if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
        return next();
      }
      res.sendFile(indexHtmlPath);
    });
    
    logger.info(`Serving frontend from: ${frontendBuildPath}`);
  } else {
    logger.warn(`Frontend build not found at: ${frontendBuildPath}`);
    logger.warn('Running in API-only mode');
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  const fs = require('fs');
  const frontendBuildPath = path.join(__dirname, '../../frontend/build');
  const frontendExists = fs.existsSync(frontendBuildPath);
  
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    frontend: {
      buildExists: frontendExists,
      buildPath: frontendBuildPath
    }
  });
});

// API routes
app.use('/api', csvController);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;