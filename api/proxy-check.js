// API Handler: Check Network & Proxy Status
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const startTime = Date.now();
  let outboundIp = 'N/A';
  let latencyMs = 0;
  let status = 'online';

  try {
    const ipRes = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(4000) });
    if (ipRes.ok) {
      const data = await ipRes.json();
      outboundIp = data.ip || 'Unknown';
    }
  } catch {
    outboundIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
  }

  latencyMs = Date.now() - startTime;

  return res.status(200).json({
    status: status,
    outboundIp: outboundIp,
    latencyMs: latencyMs,
    gateway: 'API Muse 2026 Vercel Edge Serverless',
    timestamp: new Date().toISOString()
  });
};
