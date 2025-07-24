const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: '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'
});

module.exports = async function handler(req, res) {
  // Enable CORS for cross-origin requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ 
      error: 'Method not allowed. Use POST to send chart images for analysis.' 
    });
    return;
  }

  try {
    const { images } = req.body;
    
    // Validate input
    if (!images || !Array.isArray(images) || images.length !== 4) {
      res.status(400).json({ 
        error: 'Please provide exactly 4 chart images in base64 format',
        received: images ? images.length : 0
      });
      return;
    }

    console.log('Starting analysis of 4 chart images...');
    
    // Call Claude API
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
                "rationale": "detailed explanation"
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
    
    console.log('Analysis completed successfully');
    
    res.status(200).json({ 
      success: true, 
      analysis,
      timestamp: new Date().toISOString(),
      processingTime: 'Completed'
    });
    
  } catch (error) {
    console.error('Analysis error:', error);
    
    // Handle specific error types
    if (error.message.includes('JSON')) {
      res.status(500).json({ 
        success: false, 
        error: 'Analysis completed but response format was invalid. Please try again.',
        details: 'JSON parsing error'
      });
    } else if (error.message.includes('rate limit')) {
      res.status(429).json({ 
        success: false, 
        error: 'Rate limit exceeded. Please wait a moment and try again.',
        details: 'API rate limit'
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Analysis failed. Please check your images and try again.',
        details: error.message
      });
    }
  }
};
