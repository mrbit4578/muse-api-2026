// API Handler: Check Auth Status & Quota
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-muse-token, x-account-id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const authHeader = req.headers.authorization || '';
  const apiKey = authHeader.replace(/^Bearer\s+/i, '').trim() || req.headers['x-muse-token'] || req.query?.apiKey;

  if (!global.__MUSE_ACCOUNTS) {
    global.__MUSE_ACCOUNTS = new Map();
  }

  let account = null;
  if (apiKey && global.__MUSE_ACCOUNTS.has(apiKey)) {
    account = global.__MUSE_ACCOUNTS.get(apiKey);
  } else if (global.__MUSE_ACCOUNTS.size > 0) {
    // Return first active account if no key provided
    account = global.__MUSE_ACCOUNTS.values().next().value;
  }

  const serverTime = new Date().toISOString();

  if (!account) {
    return res.status(200).json({
      authenticated: false,
      message: 'Chưa có tài khoản Muse nào được kích hoạt. Hãy đăng nhập để bắt đầu.',
      serverTime: serverTime,
      accountsCount: 0
    });
  }

  return res.status(200).json({
    authenticated: true,
    email: account.email,
    plan: account.plan,
    status: account.status,
    quota: account.quota,
    models: account.models,
    serverTime: serverTime,
    accountsCount: global.__MUSE_ACCOUNTS.size,
    lastActive: account.lastActive
  });
};
