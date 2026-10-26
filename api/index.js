// API Root Handler: Health & Capabilities
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-muse-token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return res.status(200).json({
    status: 'online',
    service: 'API Muse 2026 Gateway',
    version: '2.0.0',
    deployment: 'Vercel Serverless',
    timestamp: new Date().toISOString(),
    endpoints: {
      chat_completions: '/v1/chat/completions',
      models: '/v1/models',
      images: '/v1/images/generations',
      videos: '/v1/videos',
      auth_status: '/api/auth/status',
      account_pool: '/api/accounts'
    }
  });
};
