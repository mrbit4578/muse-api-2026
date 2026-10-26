// Content Script: Bridges Chrome Extension with API Muse 2026 Web Dashboard & muse.ai
(function () {
  'use strict';

  const isMuseWeb = window.location.hostname.includes('muse-api-2026.vercel.app') || 
                    window.location.hostname === 'localhost' || 
                    window.location.hostname.includes('vercel.app');

  const isMuseAi = window.location.hostname.includes('muse.ai');

  // 1. Dashboard bridge
  if (isMuseWeb) {
    document.documentElement.setAttribute('data-muse-extension-installed', 'true');
    window.sessionStorage.setItem('muse_extension_installed', 'true');

    // Notify window that extension is active
    window.postMessage({ type: 'MUSE_EXTENSION_PING', ready: true, version: '5.2.0' }, '*');

    // Listen for manual sync requests from dashboard button
    window.addEventListener('message', (event) => {
      if (!event.data || event.source !== window) return;

      if (event.data.type === 'MUSE_CHROME_AUTO_SYNC_REQUEST') {
        try {
          chrome.runtime.sendMessage({ action: 'autoFetchMuseCookies' }, (response) => {
            if (response && response.success && (response.cookieString || response.hasHatchSession)) {
              window.postMessage({
                type: 'MUSE_CHROME_AUTO_SYNC_RESPONSE',
                success: true,
                cookies: response.cookies,
                cookieString: response.cookieString,
                matchedKeys: response.matchedKeys
              }, '*');
            } else {
              window.postMessage({
                type: 'MUSE_CHROME_AUTO_SYNC_RESPONSE',
                success: false,
                error: response?.error || 'Chưa tìm thấy phiên đăng nhập trên https://muse.ai'
              }, '*');
            }
          });
        } catch (err) {
          window.postMessage({
            type: 'MUSE_CHROME_AUTO_SYNC_RESPONSE',
            success: false,
            error: err.message
          }, '*');
        }
      }
    });

    // Auto-check on page load
    setTimeout(() => {
      try {
        chrome.runtime.sendMessage({ action: 'autoFetchMuseCookies' }, (response) => {
          if (response && response.success && response.cookieString && response.cookieString.length > 10) {
            window.postMessage({
              type: 'MUSE_CHROME_AUTO_DETECTED',
              cookies: response.cookies,
              cookieString: response.cookieString,
              matchedKeys: response.matchedKeys
            }, '*');
          }
        });
      } catch {}
    }, 600);
  }

  // 2. muse.ai bridge: Observe active session & ensure tokens are captured
  if (isMuseAi) {
    // When on muse.ai, notify background worker that user is actively browsing
    try {
      chrome.runtime.sendMessage({ action: 'autoFetchMuseCookies' }, () => {});
    } catch {}
  }
})();
