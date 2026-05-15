// api/claude.js
// Vercel serverless function — proxies requests to Anthropic API
// Keeps your ANTHROPIC_API_KEY safe on the server

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Basic rate limiting by IP (Vercel KV or simple in-memory for now)
  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';

  try {
    const { prompt, max_tokens = 700 } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'prompt is required' });
    }

    if (prompt.length > 4000) {
      return res.status(400).json({ error: 'prompt too long' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: Math.min(max_tokens, 1000), // cap at 1000
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('Anthropic error:', err);
      return res.status(response.status).json({ error: 'AI unavailable' });
    }

    const data = await response.json();
    const text = data.content.map(i => i.text || '').join('').trim();

    return res.status(200).json({ text });

  } catch (error) {
    console.error('Claude proxy error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
