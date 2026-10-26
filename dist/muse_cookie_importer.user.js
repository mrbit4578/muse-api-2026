// ==UserScript==
// @name         Muse AI Token Auto-Sync (API Muse 2026)
// @namespace    https://github.com/mrbit4578/api-muse-2026
// @version      2.0.0
// @description  Tự động trích xuất token Hatch (hatch_sess, hatch_vml, hatch_gw, hatch_native_auth_device) từ muse.ai và đẩy trực tiếp về API Muse 2026 Gateway.
// @author       API Muse Team
// @match        https://muse.ai/*
// @match        https://*.muse.ai/*
// @grant        GM_cookie
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @connect      *
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  const STORE_KEY = 'API_MUSE_GATEWAY_URL';
  let defaultBase = GM_getValue(STORE_KEY, 'http://localhost:3000');

  // Floating Sync Button on muse.ai
  const btn = document.createElement('div');
  btn.innerHTML = `⚡ Đẩy Token Về API Muse`;
  btn.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 999999;
    padding: 12px 18px;
    background: linear-gradient(135deg, #00d2ff, #3a7bd5);
    color: #ffffff;
    font-size: 13px;
    font-weight: 700;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    border-radius: 999px;
    box-shadow: 0 8px 24px rgba(0, 210, 255, 0.4);
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    user-select: none;
  `;
  btn.onmouseover = () => { btn.style.transform = 'scale(1.05)'; };
  btn.onmouseout = () => { btn.style.transform = 'scale(1)'; };

  btn.onclick = async () => {
    btn.textContent = '⏳ Đang quét cookies...';

    const cookies = {};
    if (typeof GM_cookie !== 'undefined' && typeof GM_cookie.list === 'function') {
      try {
        const list = await new Promise(res => {
          GM_cookie.list({ domain: 'muse.ai' }, (c, err) => res(err ? [] : c || []));
        });
        for (const item of list) {
          if (item && item.name) cookies[item.name] = item.value;
        }
      } catch (e) {
        console.warn('GM_cookie list note:', e);
      }
    }

    // Fallback: extract from document.cookie
    if (document.cookie) {
      document.cookie.split(';').forEach(pair => {
        const [k, v] = pair.split('=');
        if (k && v && !cookies[k.trim()]) cookies[k.trim()] = v.trim();
      });
    }

    const targetUrl = prompt('Nhập địa chỉ API Muse Gateway của bạn:', defaultBase);
    if (!targetUrl) {
      btn.textContent = '⚡ Đẩy Token Về API Muse';
      return;
    }

    defaultBase = targetUrl.replace(/\/+$/, '');
    GM_setValue(STORE_KEY, defaultBase);

    btn.textContent = '🚀 Đang gửi về Gateway...';

    GM_xmlhttpRequest({
      method: 'POST',
      url: `${defaultBase}/api/auth/extract-session`,
      headers: { 'Content-Type': 'application/json' },
      data: JSON.stringify({
        cookies: cookies,
        cookieString: document.cookie,
        email: 'tampermonkey_user@muse.ai'
      }),
      onload: function (response) {
        try {
          const res = JSON.parse(response.responseText);
          if (res.success && res.apiKey) {
            btn.textContent = '✅ Đã Đồng Bộ!';
            alert(`🎉 Thành công! Đã tạo API Key Muse:\n\n${res.apiKey}\n\nĐã kết nối với ${defaultBase}`);
            setTimeout(() => { btn.textContent = '⚡ Đẩy Token Về API Muse'; }, 3000);
          } else {
            alert('Lỗi: ' + (res.error || response.responseText));
            btn.textContent = '⚡ Đẩy Token Về API Muse';
          }
        } catch (e) {
          alert('Không phân tích được phản hồi từ server: ' + response.responseText);
          btn.textContent = '⚡ Đẩy Token Về API Muse';
        }
      },
      onerror: function (err) {
        alert('Lỗi kết nối tới ' + defaultBase + '. Hãy chắc chắn máy chủ API Muse đang chạy.');
        btn.textContent = '⚡ Đẩy Token Về API Muse';
      }
    });
  };

  document.body.appendChild(btn);
})();
