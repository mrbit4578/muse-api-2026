// API Handler: OpenAI Compatible /v1/images/generations
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-muse-token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: { message: 'Method not allowed, use POST', type: 'invalid_request_error' }
    });
  }

  const { prompt, n = 1, size = '1024x1024', model = 'dall-e-3-muse' } = req.body || {};

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({
      error: { message: 'Tham số `prompt` là bắt buộc.', type: 'invalid_request_error' }
    });
  }

  const cleanPrompt = String(prompt).replace(/[^a-zA-Z0-9\s,.-]/g, ' ').trim();
  const realisticPrompt = encodeURIComponent(`${cleanPrompt}, photorealistic, highly detailed, 8k resolution, cinematic lighting, masterpiece photography`);
  const imageUrl = `https://image.pollinations.ai/prompt/${realisticPrompt}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;

  const images = [];
  for (let i = 0; i < Math.min(n, 4); i++) {
    images.push({
      url: imageUrl,
      revised_prompt: prompt
    });
  }

  return res.status(200).json({
    created: Math.floor(Date.now() / 1000),
    data: images
  });
};
