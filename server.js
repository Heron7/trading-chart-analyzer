const express = require('express');
const analyzeHandler = require('./api/analyze');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API route
app.use('/api/analyze', analyzeHandler);

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'SMC Trading Analysis API is running',
    endpoint: '/api/analyze',
    method: 'POST'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
