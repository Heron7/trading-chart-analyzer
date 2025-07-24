const http = require('http');
const url = require('url');

const PORT = process.env.PORT || 8080;

console.log('Starting SMC Trading Analysis API...');

// Create HTTP server
const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  // Handle OPTIONS (preflight) requests
  if (method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  // Health check endpoint
  if (path === '/' && method === 'GET') {
    console.log('Health check requested');
    res.statusCode = 200;
    res.end(JSON.stringify({
      status: 'SMC Trading Analysis API is running successfully',
      version: '1.0.0',
      endpoints: {
        health: '/ (GET)',
        analyze: '/api/analyze (POST)'
      },
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }));
    return;
  }

  // API analyze endpoint
  if (path === '/api/analyze') {
    if (method === 'GET') {
      console.log('GET request to /api/analyze - returning method not allowed');
      res.statusCode = 405;
      res.end(JSON.stringify({
        error: 'Method not allowed. Use POST to send chart images for analysis.',
        allowedMethods: ['POST'],
        endpoint: '/api/analyze',
        timestamp: new Date().toISOString()
      }));
      return;
    }

    if (method === 'POST') {
      console.log('POST request to /api/analyze - processing...');
      let body = '';
      
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          console.log('Received data, validating...');
          
          // Validate request
          if (!data.images || !Array.isArray(data.images) || data.images.length !== 4) {
            console.log('Invalid request - wrong number of images');
            res.statusCode = 400;
            res.end(JSON.stringify({
              success: false,
              error: 'Please provide exactly 4 chart images in base64 format',
              received: data.images ? data.images.length : 0,
              expected: 4
            }));
            return;
          }

          console.log('Request validated successfully');
          
          // For now, return success response (we'll add Claude later)
          res.statusCode = 200;
          res.end(JSON.stringify({
            success: true,
            message: 'API connection working! Ready for Claude integration.',
            receivedImages: data.images.length,
            timestamp: new Date().toISOString(),
            status: 'Connection test successful - Claude integration will be added next'
          }));
          
        } catch (error) {
          console.error('Error parsing request body:', error);
          res.statusCode = 400;
          res.end(JSON.stringify({
            success: false,
            error: 'Invalid JSON in request body',
            details: error.message
          }));
        }
      });
      
      req.on('error', (error) => {
        console.error('Request error:', error);
        res.statusCode = 500;
        res.end(JSON.stringify({
          success: false,
          error: 'Request processing error',
          details: error.message
        }));
      });
      
      return;
    }
  }

  // 404 for all other paths
  console.log(`404 - Path not found: ${path}`);
  res.statusCode = 404;
  res.end(JSON.stringify({
    error: 'Endpoint not found',
    path: path,
    method: method,
    availableEndpoints: {
      health: '/ (GET)',
      analyze: '/api/analyze (POST)'
    }
  }));
});

// Error handling
server.on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 SMC Trading Analysis API successfully started`);
  console.log(`📊 Port: ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/`);
  console.log(`🔍 API endpoint: http://localhost:${PORT}/api/analyze`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
