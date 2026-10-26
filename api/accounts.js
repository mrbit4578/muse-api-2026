// API Handler: Manage Account Pool
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-muse-token, x-account-id');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!global.__MUSE_ACCOUNTS) {
    global.__MUSE_ACCOUNTS = new Map();
  }

  if (req.method === 'GET') {
    const list = [];
    const seen = new Set();
    for (const [key, acc] of global.__MUSE_ACCOUNTS.entries()) {
      if (acc.id && !seen.has(acc.id)) {
        seen.add(acc.id);
        list.push({
          id: acc.id,
          email: acc.email,
          apiKeyPreview: `${acc.apiKey.slice(0, 10)}...${acc.apiKey.slice(-4)}`,
          apiKey: acc.apiKey,
          plan: acc.plan,
          status: acc.status,
          quota: acc.quota,
          createdAt: acc.createdAt,
          lastActive: acc.lastActive,
          liveVerified: acc.liveVerified
        });
      }
    }
    return res.status(200).json({ success: true, count: list.length, accounts: list });
  }

  if (req.method === 'DELETE') {
    const id = req.body?.id || req.query?.id;
    const apiKey = req.body?.apiKey || req.query?.apiKey;
    let deleted = false;
    for (const [key, acc] of global.__MUSE_ACCOUNTS.entries()) {
      if ((id && acc.id === id) || (apiKey && (acc.apiKey === apiKey || key === apiKey))) {
        global.__MUSE_ACCOUNTS.delete(key);
        if (acc.apiKey) global.__MUSE_ACCOUNTS.delete(acc.apiKey);
        if (acc.id) global.__MUSE_ACCOUNTS.delete(acc.id);
        deleted = true;
        break;
      }
    }
    return res.status(200).json({ success: deleted, message: deleted ? 'Đã xóa tài khoản' : 'Không tìm thấy tài khoản' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
