// Background Service Worker - API Muse 2026 Companion & Proxy Pro
let connectionCheckInterval = null;
let isNetworkOnline = false;
let cachedAuth = { username: '', password: '' };

// Initialize on installed/startup
chrome.runtime.onInstalled.addListener(() => {
  loadAndApplyProxy();
});

chrome.runtime.onStartup.addListener(() => {
  loadAndApplyProxy();
});

// Proxy Authentication Handler
chrome.webRequest.onAuthRequired.addListener(
  function(details) {
    if (details.isProxy === false) return {};
    if (cachedAuth.username && cachedAuth.password) {
      console.log('🔐 [Sync] Auto-Login Proxy:', cachedAuth.username);
      return {
        authCredentials: {
          username: cachedAuth.username,
          password: cachedAuth.password
        }
      };
    }
    return new Promise((resolve) => {
      chrome.storage.local.get(['proxyUsername', 'proxyPassword'], (data) => {
        if (data.proxyUsername && data.proxyPassword) {
          cachedAuth.username = data.proxyUsername.trim();
          cachedAuth.password = data.proxyPassword.trim();
          resolve({
            authCredentials: {
              username: cachedAuth.username,
              password: cachedAuth.password
            }
          });
        } else {
          resolve({});
        }
      });
    });
  },
  { urls: ['<all_urls>'] },
  ['blocking']
);

// Cache credentials on init
chrome.storage.local.get(['proxyUsername', 'proxyPassword'], (data) => {
  if (data.proxyUsername && data.proxyPassword) {
    cachedAuth.username = data.proxyUsername;
    cachedAuth.password = data.proxyPassword;
  }
});

// Message Bus
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'autoFetchMuseCookies') {
    // ⚡ Auto-Fetch Muse AI Cookies Feature
    getMuseSessionCookies()
      .then(cookiesData => sendResponse({ success: true, ...cookiesData }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  } else if (request.action === 'setProxy') {
    setProxyConfig(request.config);
    sendResponse({ success: true });
  } else if (request.action === 'saveConfigOnly') {
    saveConfigToStorage(request.config);
    sendResponse({ success: true });
  } else if (request.action === 'disableProxy') {
    disableProxy(request.blockDirect);
    sendResponse({ success: true });
  } else if (request.action === 'getProxyStatus') {
    getProxyStatus().then(status => {
      status.isOnline = isNetworkOnline;
      sendResponse(status);
    });
    return true;
  }
});

// ⚡ Extract Muse Cookies from browser session (All domains & URLs)
async function getMuseSessionCookies() {
  return new Promise((resolve) => {
    chrome.cookies.getAll({ domain: 'muse.ai' }, (cookies1) => {
      chrome.cookies.getAll({ url: 'https://muse.ai/' }, (cookies2) => {
        const combined = [...(cookies1 || []), ...(cookies2 || [])];
        const extracted = {};
        const pairs = [];
        const seen = new Set();

        for (const c of combined) {
          if (c && c.name && !seen.has(c.name)) {
            seen.add(c.name);
            extracted[c.name] = c.value;
            pairs.push(`${c.name}=${c.value}`);
          }
        }

        const hatchKeys = ['hatch_sess', 'hatch_gw', 'hatch_vml', 'hatch_native_auth_device'];
        const matchedHatch = hatchKeys.filter(k => extracted[k]);

        resolve({
          cookies: extracted,
          cookieString: pairs.join('; '),
          matchedKeys: matchedHatch,
          hasHatchSession: matchedHatch.length > 0 || seen.size > 0,
          count: seen.size
        });
      });
    });
  });
}

function saveConfigToStorage(config) {
  const cleanUser = (config.username || '').trim();
  const cleanPass = (config.password || '').trim();
  chrome.storage.local.set({
    proxyHost: config.host.trim(),
    proxyPort: config.port.trim(),
    proxyType: config.type,
    proxyUsername: cleanUser,
    proxyPassword: cleanPass
  });
  cachedAuth.username = cleanUser;
  cachedAuth.password = cleanPass;
}

function loadAndApplyProxy() {
  chrome.storage.local.get(
    ['proxyEnabled', 'proxyHost', 'proxyPort', 'proxyType', 'proxyUsername', 'proxyPassword', 'blockDirect'],
    (data) => {
      cachedAuth.username = data.proxyUsername || '';
      cachedAuth.password = data.proxyPassword || '';

      if (data.proxyEnabled && data.proxyHost) {
        const config = {
          host: data.proxyHost,
          port: data.proxyPort,
          type: data.proxyType || 'socks5',
          username: data.proxyUsername,
          password: data.proxyPassword
        };
        setProxyConfig(config);
      } else if (!data.proxyEnabled && data.blockDirect) {
        blockInternetAccess();
      } else {
        updateBadge('');
      }
    }
  );
}

function setProxyConfig(config) {
  chrome.storage.local.set({ proxyEnabled: true });
  config.username = (config.username || '').trim();
  config.password = (config.password || '').trim();
  saveConfigToStorage(config);

  const safeHost = config.host.replace(/:\d+$/, '').trim();
  const safePort = parseInt(config.port, 10);
  const proxyRule = { host: safeHost, port: safePort };

  if (config.type === 'http') {
    proxyRule.scheme = 'http';
  } else {
    proxyRule.scheme = config.type;
  }

  const proxyConfig = {
    mode: 'fixed_servers',
    rules: {
      singleProxy: proxyRule,
      bypassList: ['<local>', '127.0.0.1', 'localhost']
    }
  };

  chrome.proxy.settings.set({ value: proxyConfig, scope: 'regular' }, () => {
    startChecker();
  });
}

function disableProxy(shouldBlockDirect) {
  chrome.storage.local.set({ proxyEnabled: false, blockDirect: shouldBlockDirect });
  if (shouldBlockDirect) {
    blockInternetAccess();
  } else {
    chrome.proxy.settings.set({ value: { mode: 'direct' }, scope: 'regular' }, () => {
      stopChecker();
      updateBadge('');
      isNetworkOnline = false;
    });
  }
}

function blockInternetAccess() {
  const deadConfig = {
    mode: 'fixed_servers',
    rules: {
      singleProxy: { scheme: 'socks5', host: '127.0.0.1', port: 65535 },
      bypassList: ['<local>', '127.0.0.1', 'localhost']
    }
  };
  chrome.proxy.settings.set({ value: deadConfig, scope: 'regular' }, () => {
    stopChecker();
    updateBadge('LOCK', '#000000');
    isNetworkOnline = false;
  });
}

function startChecker() {
  checkConnectivity();
  if (connectionCheckInterval) clearInterval(connectionCheckInterval);
  connectionCheckInterval = setInterval(checkConnectivity, 5000);
}

function stopChecker() {
  if (connectionCheckInterval) clearInterval(connectionCheckInterval);
  isNetworkOnline = false;
}

async function checkConnectivity() {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000);
    await fetch('https://www.google.com/generate_204', {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
      mode: 'no-cors'
    });
    clearTimeout(id);
    isNetworkOnline = true;
    updateBadge('ON', '#10B981');
  } catch (error) {
    isNetworkOnline = false;
    updateBadge('ERR', '#EF4444');
  }
}

function updateBadge(text, color) {
  chrome.action.setBadgeText({ text: text });
  if (color) chrome.action.setBadgeBackgroundColor({ color: color });
}

async function getProxyStatus() {
  return new Promise((resolve) => {
    chrome.storage.local.get(
      ['proxyEnabled', 'proxyHost', 'proxyPort', 'proxyType', 'proxyUsername', 'proxyPassword', 'blockDirect'],
      (data) => {
        resolve({
          enabled: data.proxyEnabled || false,
          host: data.proxyHost || '',
          port: data.proxyPort || '',
          type: data.proxyType || 'socks5',
          username: data.proxyUsername,
          password: data.proxyPassword,
          blockDirect: data.blockDirect || false
        });
      }
    );
  });
}
