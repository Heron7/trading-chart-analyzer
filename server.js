const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Health check route
app.get('/', (req, res) => {
  console.log('Health check requested');
  res.json({ 
    status: 'SMC Trading Analysis API is running',
    version: '1.0.0',
    endpoint: '/api/analyze',
    method: 'POST',
    timestamp: new Date().toISOString()
  });
});

// Import analyze function (with error handling)
let analyzeHandler;
try {
  analyzeHandler = require('./api/analyze');
  console.log('Analyze handler loaded successfully');
} catch (error) {
  console.error('Failed to load analyze handler:', error);
  analyzeHandler = (req, res) => {
    res.status(500).json({ 
      error: 'Analyze handler not available',
      details: error.message 
    });
  };
}

// API route
app.post('/api/analyze', (req, res) => {
  console.log('Analyze endpoint called');
  try {
    analyzeHandler(req, res);
  } catch (error) {
    console.error('Error in analyze handler:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Handle GET requests to /api/analyze
app.get('/api/analyze', (req, res) => {
  res.status(405).json({
    error: 'Method not allowed. Use POST to send chart images for analysis.',
    allowedMethods: ['POST'],
    endpoint: '/api/analyze'
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log('404 for path:', req.originalUrl);
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    availableEndpoints: ['/', '/api/analyze']
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    details: error.message
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 SMC Trading Analysis API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/`);
  console.log(`🔍 API endpoint: http://localhost:${PORT}/api/analyze`);
});
