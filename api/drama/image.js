// API Handler: High-Performance Cinematic Photorealistic Image Generator & Proxy
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, max-age=86400, immutable');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  const { scene = '1', title = '', prompt = '', mood = 'cinematic' } = req.query || {};
  const sceneNum = parseInt(scene, 10) || 1;

  // Build high-resolution photorealistic cinematic AI prompt
  const baseDescription = prompt || title || 'cinematic vietnamese drama scene, luxury banquet, emotional drama';
  const cleanDesc = String(baseDescription).replace(/[^a-zA-Z0-9\s,.-]/g, ' ').trim();
  const aiPrompt = `${cleanDesc}, cinematic film still, photorealistic 8k, award winning cinematography, dramatic lighting, shot on 35mm anamorphic lens, master photography`;
  const seed = (sceneNum * 7919 + 101) % 999999;
  const aiUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(aiPrompt)}?width=1280&height=720&nologo=true&seed=${seed}`;

  // Attempt to fetch and stream real JPEG image
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    const aiRes = await fetch(aiUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'image/jpeg, image/png, image/*, */*'
      }
    });
    clearTimeout(timeout);

    if (aiRes.ok) {
      const buffer = await aiRes.arrayBuffer();
      res.setHeader('Content-Type', aiRes.headers.get('content-type') || 'image/jpeg');
      res.statusCode = 200;
      return res.end(Buffer.from(buffer));
    }
  } catch (err) {
    // If direct serverless fetch times out, issue HTTP 307 redirect directly to the AI image CDN
    if (typeof res.redirect === 'function') {
      return res.redirect(307, aiUrl);
    }
    res.statusCode = 307;
    res.setHeader('Location', aiUrl);
    return res.end();
  }

  // Fallback: direct redirect
  if (typeof res.redirect === 'function') {
    return res.redirect(307, aiUrl);
  }
  res.statusCode = 307;
  res.setHeader('Location', aiUrl);
  return res.end();
};
