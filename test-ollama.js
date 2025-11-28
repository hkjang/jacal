const express = require('express');
const app = express();
app.use(express.json());

// Test endpoint
app.post('/test-nlu', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch('http://localhost:11434/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-oss:20b',
        messages: [
          {
            role: 'system',
            content: 'Parse this text and return JSON: {"entities": [{"type": "event", "title": "meeting", "startAt": "2025-11-29T09:00:00Z", "endAt": "2025-11-29T10:00:00Z"}]}'
          },
          {
            role: 'user',
            content: req.body.input || '내일 오전 9시 회의 1시간'
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      })
    });

    const data = await response.json();
    console.log('Ollama Response:', JSON.stringify(data, null, 2));
    res.json(data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => {
  console.log('Test server running on port 3001');
  console.log('Test with: curl -X POST http://localhost:3001/test-nlu -H "Content-Type: application/json" -d "{\\"input\\": \\"test\\"}"');
});
