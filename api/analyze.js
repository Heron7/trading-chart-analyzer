const { Anthropic } = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: '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'
});

module.exports = async (req, res) => {
  // Enable CORS for cross-origin requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed. Use POST to send chart images for analysis.',
      allowedMethods: ['POST'],
      endpoint: '/api/analyze'
    });
  }

  try {
    const { images } = req.body;
    
    // Validate input
    if (!images || !Array.isArray(images) || images.length !== 4) {
      return res.status(400).json({ 
        error: 'Please provide exactly 4 chart images in base64 format',
        received: images ? images.length : 0,
        expected: 4,
        format: 'Array of base64 strings'
      });
    }

    console.log('Starting SMC analysis of 4 chart images...');
    
    // Call Claude API for analysis
    const response = await anthropic.messages.create({
      model: "claude-4-sonnet-20250522",
      max_tokens: 4000,
      messages: [{
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze these 4 cryptocurrency trading charts using Smart Money Concepts (SMC) and ICT principles.
            
            Charts provided in order: 5-minute, 15-minute, 1-hour, 4-hour timeframes.
            
            Provide comprehensive analysis and return results in this exact JSON format:
            {
              "marketStructure": {
                "4h": {"trend": "BULLISH/BEARISH/NEUTRAL", "structure": "CHoCH/BOS/Consolidation", "keyLevel": "price level"},
                "1h": {"trend": "BULLISH/BEARISH/NEUTRAL", "structure": "CHoCH/BOS/Consolidation", "keyLevel": "price level"},
                "15m": {"trend": "BULLISH/BEARISH/NEUTRAL", "structure": "CHoCH/BOS/Consolidation", "keyLevel": "price level"},
                "5m": {"trend": "BULLISH/BEARISH/NEUTRAL", "structure": "CHoCH/BOS/Consolidation", "keyLevel": "price level"}
              },
              "smcLevels": [
                {"type": "Order Block/Fair Value Gap/Liquidity Zone", "price": "exact price", "status": "Active/Pending/Swept", "significance": "High/Medium/Low"}
              ],
              "tradeSetup": {
                "direction": "LONG/SHORT",
                "entryZone": "price range",
                "stopLoss": "price",
                "takeProfit1": "price",
                "takeProfit2": "price", 
                "takeProfit3": "price",
                "rationale": "detailed explanation of the setup"
              },
              "riskManagement": {
                "rrRatio1": "1:X format",
                "rrRatio2": "1:X format",
                "rrRatio3": "1:X format"
              },
              "confirmationChecklist": [
                {"item": "HTF Trend Alignment", "status": "Confirmed/Pending", "priority": "High"},
                {"item": "Order Block Retest", "status": "Confirmed/Pending", "priority": "High"},
                {"item": "Break of Structure", "status": "Confirmed/Pending", "priority": "High"},
                {"item": "Volume Confirmation", "status": "Confirmed/Pending", "priority": "Medium"},
                {"item": "Fair Value Gap", "status": "Confirmed/Pending", "priority": "Medium"}
              ]
            }`
          },
          ...images.map((img, index) => ({
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: img
            }
          }))
        ]
      }]
    });

    const analysisText = response.content[0].text;
    const analysis = JSON.parse(analysisText);
    
    console.log('SMC analysis completed successfully');
    
    return res.status(200).json({ 
      success: true, 
      analysis,
      metadata: {
        timestamp: new Date().toISOString(),
        timeframes: ['5m', '15m', '1h', '4h'],
        analysisType: 'SMC/ICT',
        processingTime: 'Completed'
      }
    });
    
  } catch (error) {
    console.error('Analysis error:', error);
    
    // Handle specific error types
    if (error.message.includes('JSON')) {
      return res.status(500).json({ 
        success: false, 
        error: 'Analysis completed but response format was invalid. Please try again.',
        errorType: 'JSON_PARSE_ERROR'
      });
    } else if (error.message.includes('rate limit')) {
      return res.status(429).json({ 
        success: false, 
        error: 'Rate limit exceeded. Please wait a moment and try again.',
        errorType: 'RATE_LIMIT',
        retryAfter: '60 seconds'
      });
    } else if (error.message.includes('api key')) {
      return res.status(401).json({ 
        success: false, 
        error: 'API authentication failed. Please check configuration.',
        errorType: 'AUTH_ERROR'
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        error: 'Analysis failed. Please check your images and try again.',
        errorType: 'GENERAL_ERROR',
        details: error.message
      });
    }
  }
};
