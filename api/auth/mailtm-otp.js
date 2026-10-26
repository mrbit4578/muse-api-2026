// API Handler: 1-Click Disposable Mail.tm Email & Auto OTP Extractor (Ported from Muse2API)
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const action = req.query?.action || req.body?.action || 'create';

  try {
    if (action === 'create') {
      // 1. Fetch active domain from Mail.tm
      const domRes = await fetch('https://api.mail.tm/domains', {
        headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0' }
      });
      const domData = await domRes.json();
      const domains = domData?.['hydra:member'] || domData || [];
      const activeDom = domains.find(d => d.isActive !== false) || domains[0];

      if (!activeDom || !activeDom.domain) {
        throw new Error('Không lấy được tên miền khả dụng từ Mail.tm');
      }

      const domain = activeDom.domain;
      const username = 'muse_' + Math.random().toString(36).substring(2, 10);
      const email = `${username}@${domain}`;
      const password = 'MuseP@ss' + Math.floor(100000 + Math.random() * 900000);

      // 2. Create Mail.tm account
      const createRes = await fetch('https://api.mail.tm/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0'
        },
        body: JSON.stringify({ address: email, password: password })
      });

      if (!createRes.ok && createRes.status !== 201) {
        const errJson = await createRes.json().catch(() => ({}));
        throw new Error(errJson.message || `Lỗi tạo hòm thư tạm (HTTP ${createRes.status})`);
      }

      // 3. Get JWT token
      const tokenRes = await fetch('https://api.mail.tm/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0'
        },
        body: JSON.stringify({ address: email, password: password })
      });

      const tokenData = await tokenRes.json();
      const token = tokenData.token;

      if (!token) {
        throw new Error('Không lấy được token xác thực Mail.tm');
      }

      return res.status(200).json({
        success: true,
        email: email,
        password: password,
        token: token,
        message: 'Tạo email tạm thời thành công! Hãy dán email này vào trang đăng nhập/đăng ký của Muse.'
      });

    } else if (action === 'poll') {
      const token = req.body?.token || req.query?.token;
      if (!token) {
        return res.status(400).json({ success: false, error: 'Thiếu mã token Mail.tm' });
      }

      const msgRes = await fetch('https://api.mail.tm/messages?page=1', {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'Mozilla/5.0'
        }
      });

      if (!msgRes.ok) {
        return res.status(200).json({
          success: true,
          found: false,
          message: 'Chưa thể kết nối hòm thư, đang tiếp tục thử lại...'
        });
      }

      const msgData = await msgRes.json();
      const msgs = msgData?.['hydra:member'] || msgData || [];

      if (!Array.isArray(msgs) || msgs.length === 0) {
        return res.status(200).json({
          success: true,
          found: false,
          message: 'Đang đợi email từ Muse gửi tới...'
        });
      }

      // Retrieve full message body of the newest email
      const latest = msgs[0];
      const detailRes = await fetch(`https://api.mail.tm/messages/${latest.id}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'Mozilla/5.0'
        }
      });

      const full = await detailRes.json();
      const subject = full.subject || latest.subject || '';
      const body = full.text || full.intro || (Array.isArray(full.html) ? full.html[0] : '') || '';
      const combined = `${subject}\n${body}`;

      // Extract 4 to 8 digit OTP codes
      const match = combined.match(/(?<!\d)(\d{4,8})(?!\d)/);
      const code = match ? match[1] : null;

      return res.status(200).json({
        success: true,
        found: true,
        code: code,
        from: full.from?.address || latest.from?.address || 'noreply@muse.ai',
        subject: subject,
        preview: body.trim().slice(0, 300),
        message: code ? `🎉 Tìm thấy mã OTP: ${code}` : 'Đã nhận được thư mới, đang tìm mã số xác nhận...'
      });

    } else {
      return res.status(400).json({ success: false, error: 'Hành động không hợp lệ' });
    }

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
