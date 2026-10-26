// API Muse 2026 - Frontend Client Application
let currentApiKey = localStorage.getItem('muse_api_key') || '';
let currentBaseUrl = window.location.origin + '/v1';
let chatHistory = [];
let isGenerating = false;

document.addEventListener('DOMContentLoaded', () => {
  // Check for URL query params: ?activated_key=sk-muse-...
  const urlParams = new URLSearchParams(window.location.search);
  const activatedKey = urlParams.get('activated_key');
  if (activatedKey && activatedKey.startsWith('sk-muse-')) {
    syncActiveApiKeyEverywhere(activatedKey);
    const source = urlParams.get('from');
    if (source === 'android') {
      showNotice('🎉 Đã kết nối thành công tài khoản Muse AI trên điện thoại Android!', 'success');
      if (navigator.vibrate) {
        try { navigator.vibrate([80, 40, 80]); } catch(_) {}
      }
    } else if (source === 'qr_sync') {
      showNotice('📱 Đã đồng bộ tài khoản Muse AI qua mã QR thành công!', 'success');
    } else {
      showNotice('🎉 Đã tự động kích hoạt API Key từ phiên Muse AI!', 'success');
    }
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // Detect Android device
  const isAndroid = /Android/i.test(navigator.userAgent);
  if (isAndroid) {
    const bannerText = document.getElementById('chromeStatusText');
    if (bannerText && !bannerText.textContent.includes('Live')) {
      bannerText.textContent = '📱 Đang dùng Chrome Android';
    }
  }

  initTabs();
  initAuthModeToggles();
  initForms();
  initPlayground();
  checkGatewayStatus();
  loadStoredSession();
  loadAccountsList();
  updateContextHealthMonitor();
  updateDecodingLabels();
  initChromeAutoConnector();
});

// 1. Tab Navigation
function initTabs() {
  const tabLinks = document.querySelectorAll('.tab-link');
  tabLinks.forEach(link => {
    link.addEventListener('click', () => {
      const targetId = link.getAttribute('data-tab');
      switchTab(targetId);
    });
  });
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-link').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });
  document.querySelectorAll('.tab-pane').forEach(pane => {
    pane.classList.toggle('active', pane.id === tabId);
  });

  if (tabId === 'tab-accounts') {
    loadAccountsList();
  }
  if (tabId === 'tab-drama') {
    const dramaKeyEl = document.getElementById('dramaBoundApiKey');
    if (dramaKeyEl && currentApiKey) {
      dramaKeyEl.textContent = `${currentApiKey.slice(0, 14)}...`;
      dramaKeyEl.title = currentApiKey;
    }
  }
}

// 2. Auth Mode Toggles
function initAuthModeToggles() {
  const btnCreds = document.getElementById('btnModeCreds');
  const btnCookie = document.getElementById('btnModeCookie');
  const formCreds = document.getElementById('formCredentials');
  const formCookie = document.getElementById('formCookie');

  btnCreds.addEventListener('click', () => {
    btnCreds.classList.add('active');
    btnCookie.classList.remove('active');
    formCreds.style.display = 'block';
    formCookie.style.display = 'none';
  });

  btnCookie.addEventListener('click', () => {
    btnCookie.classList.add('active');
    btnCreds.classList.remove('active');
    formCookie.style.display = 'block';
    formCreds.style.display = 'none';
  });
}

// 3. Forms Handling (Auto Login & Cookie Extract)
function initForms() {
  const formCreds = document.getElementById('formCredentials');
  const formCookie = document.getElementById('formCookie');

  formCreds.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('inputEmail').value.trim();
    const password = document.getElementById('inputPassword').value;
    const btn = document.getElementById('btnSubmitLogin');

    setButtonLoading(btn, true);
    showNotice('', '');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (data.success) {
        handleAuthSuccess(data);
        showNotice(data.message, 'success');
      } else {
        showNotice(data.error || 'Đăng nhập không thành công', 'error');
      }
    } catch (err) {
      showNotice(`Lỗi kết nối máy chủ: ${err.message}`, 'error');
    } finally {
      setButtonLoading(btn, false);
    }
  });

  formCookie.addEventListener('submit', async (e) => {
    e.preventDefault();
    const cookieString = document.getElementById('inputCookieStr').value.trim();
    const btn = document.getElementById('btnSubmitCookie');

    if (!cookieString) {
      showNotice('Vui lòng dán chuỗi Cookie từ trình duyệt.', 'error');
      return;
    }

    setButtonLoading(btn, true);
    showNotice('', '');

    try {
      const res = await fetch('/api/auth/extract-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cookieString })
      });
      const data = await res.json();

      if (data.success) {
        handleAuthSuccess(data);
        showNotice(data.message, 'success');
      } else {
        showNotice(data.error || 'Trích xuất token thất bại', 'error');
      }
    } catch (err) {
      showNotice(`Lỗi kết nối: ${err.message}`, 'error');
    } finally {
      setButtonLoading(btn, false);
    }
  });
}

function handleAuthSuccess(data) {
  currentApiKey = data.apiKey;
  localStorage.setItem('muse_api_key', currentApiKey);
  localStorage.setItem('muse_session_data', JSON.stringify(data));

  // Save to persistent local pool and sync to backend
  saveAccountToLocalPool({
    id: data.account?.id || 'acc_' + Math.random().toString(36).substring(2, 9),
    email: data.account?.email || (data.email || 'user@muse.ai'),
    apiKey: data.apiKey,
    cookies: data.tokens || {},
    cookieString: data.cookieString || '',
    plan: data.account?.plan || 'Pro / Unlimited',
    quota: data.account?.quota || { total: 1000000, used: 0, remaining: 1000000 },
    status: 'Live (Sẵn sàng)',
    liveVerified: true,
    lastChecked: new Date().toISOString()
  });

  updateDashboardWithSession(data);
  loadAccountsList();
}

function updateDashboardWithSession(data) {
  const displayKey = document.getElementById('displayApiKey');
  const displayBase = document.getElementById('displayBaseUrl');
  const badge = document.getElementById('badgeActiveStatus');

  displayKey.value = data.apiKey || currentApiKey;
  displayBase.value = currentBaseUrl;

  const dramaKeyEl = document.getElementById('dramaBoundApiKey');
  if (dramaKeyEl && data.apiKey) {
    dramaKeyEl.textContent = `${data.apiKey.slice(0, 14)}...`;
    dramaKeyEl.title = data.apiKey;
  }

  badge.className = 'status-tag active';
  badge.textContent = `Active (${data.account?.plan || 'Pro'})`;

  // Tokens
  if (data.tokens) {
    document.getElementById('valHatchSess').textContent = data.tokens.hatch_sess || '-';
    document.getElementById('valHatchGw').textContent = data.tokens.hatch_gw || '-';
    document.getElementById('valHatchVml').textContent = data.tokens.hatch_vml || '-';
    document.getElementById('valHatchDevice').textContent = data.tokens.hatch_native_auth_device || '-';
  }

  // Integration code blocks
  updateIntegrationCodes(data.apiKey || currentApiKey);

  // Quota
  if (data.account && data.account.quota) {
    const q = data.account.quota;
    document.getElementById('quotaNumbers').textContent = `${q.remaining.toLocaleString()} / ${q.total.toLocaleString()} tokens`;
    const pct = Math.min(100, Math.round((q.used / q.total) * 100));
    document.getElementById('quotaFill').style.width = `${pct}%`;
  }
}

function updateIntegrationCodes(key) {
  const k = key || currentApiKey || 'sk-muse-your-api-key';
  const url = currentBaseUrl;

  const setEl = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setEl('codeNextChatUrl', url);
  setEl('codeNextChatKey', k);
  setEl('codeLobeUrl', url);
  setEl('codeLobeKey', k);
  setEl('codeCherryUrl', url);
  setEl('codeCherryKey', k);
}

function loadStoredSession() {
  const raw = localStorage.getItem('muse_session_data');
  if (raw) {
    try {
      const data = JSON.parse(raw);
      updateDashboardWithSession(data);
    } catch {
      localStorage.removeItem('muse_session_data');
    }
  } else {
    updateIntegrationCodes();
    document.getElementById('displayBaseUrl').value = currentBaseUrl;
  }
}

// 4. Status & Metric Checking
async function checkGatewayStatus() {
  const statusLabel = document.getElementById('gwStatus');
  try {
    const res = await fetch('/api/proxy-check');
    if (res.ok) {
      const data = await res.json();
      statusLabel.textContent = `Online (${data.latencyMs}ms)`;
    } else {
      statusLabel.textContent = 'Degraded';
    }
  } catch {
    statusLabel.textContent = 'Standby (Local)';
  }
}

// 5. Account Pool Management & Live Verification
function getLocalAccounts() {
  try {
    const raw = localStorage.getItem('muse_account_pool');
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    // Deduplicate on read
    const map = new Map();
    for (const a of parsed) {
      const k = (a.email ? a.email.toLowerCase().trim() : (a.apiKey || a.id || ''));
      if (k && !map.has(k)) map.set(k, a);
    }
    return Array.from(map.values());
  } catch {
    return [];
  }
}

function saveLocalAccounts(list) {
  try {
    const map = new Map();
    for (const a of (list || [])) {
      const k = (a.email ? a.email.toLowerCase().trim() : (a.apiKey || a.id || ''));
      if (k && !map.has(k)) map.set(k, a);
    }
    localStorage.setItem('muse_account_pool', JSON.stringify(Array.from(map.values())));
  } catch (e) {
    console.warn('Cannot save account pool to localStorage:', e);
  }
}

function saveAccountToLocalPool(acc) {
  const list = getLocalAccounts();
  const cleanEmail = (acc.email || '').toLowerCase().trim();
  const existingIdx = list.findIndex(a => 
    (cleanEmail && a.email && a.email.toLowerCase().trim() === cleanEmail) ||
    (acc.id && a.id === acc.id) ||
    (acc.apiKey && a.apiKey === acc.apiKey)
  );

  if (existingIdx >= 0) {
    list[existingIdx] = { ...list[existingIdx], ...acc };
  } else {
    list.push(acc);
  }
  saveLocalAccounts(list);

  // Sync to serverless backend
  fetch('/api/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'sync', ...acc })
  }).catch(() => {});
}

function formatLastChecked(iso) {
  if (!iso) return '<span style="color:var(--text-muted); font-size:11px;">Chưa kiểm tra</span>';
  try {
    const d = new Date(iso);
    const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return `<span style="font-size:11px; color:#94a3b8;">${timeStr}</span>`;
  } catch {
    return `<span style="font-size:11px;">${iso}</span>`;
  }
}

function renderAccountStatusBadge(acc) {
  if (acc.isLive === true) {
    const ping = acc.latencyMs ? ` (${acc.latencyMs}ms)` : '';
    return `<span class="status-tag live"><span class="dot live"></span> Live${ping}</span>`;
  }
  if (acc.status && (acc.status.includes('Live') || acc.status.includes('Sẵn sàng'))) {
    const msMatch = acc.status.match(/\((\d+ms)\)/);
    const ms = msMatch ? ` (${msMatch[1]})` : (acc.latencyMs ? ` (${acc.latencyMs}ms)` : '');
    return `<span class="status-tag live"><span class="dot live"></span> Live${ms}</span>`;
  }
  if (acc.status && acc.status.includes('Chưa có Cookie')) {
    return `<span class="status-tag warning" style="background:rgba(245, 158, 11, 0.2); color:#fbbf24; border:1px solid rgba(245, 158, 11, 0.4);">⚠️ Chưa có Cookie</span>`;
  }
  if (acc.status && (acc.status.includes('Hết hạn') || acc.status.includes('401') || acc.isLive === false)) {
    return `<span class="status-tag error">🔴 ${acc.status || 'Hết hạn Cookie (401)'}</span>`;
  }
  if (acc.status && acc.status.includes('Chặn IP')) {
    return `<span class="status-tag warning">🛡️ Chặn IP / WAF</span>`;
  }
  if (acc.status && acc.status.includes('Standby')) {
    return `<span class="status-tag warning">🟡 Standby</span>`;
  }
  return `<span class="status-tag warning"><span class="dot live" style="background:#f59e0b;"></span> ${acc.status || 'Chưa kiểm tra'}</span>`;
}

async function loadAccountsList() {
  const tbody = document.getElementById('accountsTableBody');
  const countLabel = document.getElementById('accCount');
  const totalAccEl = document.getElementById('totalAccCount');
  const liveAccEl = document.getElementById('liveAccCount');

  let serverAccounts = [];
  try {
    const res = await fetch('/api/accounts');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.accounts)) {
        serverAccounts = data.accounts;
      }
    }
  } catch (e) {
    console.warn('Cannot load accounts from backend:', e);
  }

  // Merge with localStorage accounts with strict deduplication
  const localList = getLocalAccounts();
  const mergedMap = new Map();
  const getDedupeKey = (a) => (a.email ? a.email.toLowerCase().trim() : (a.apiKey || a.id || ''));

  for (const acc of localList) {
    const key = getDedupeKey(acc);
    if (key) mergedMap.set(key, acc);
  }

  for (const acc of serverAccounts) {
    const key = getDedupeKey(acc);
    if (key) {
      const prev = mergedMap.get(key) || {};
      mergedMap.set(key, { ...prev, ...acc });
    }
  }

  const allAccounts = Array.from(mergedMap.values());
  saveLocalAccounts(allAccounts); // Prune duplicates from localStorage

  // Auto-activate live account (prefer live meta_* from Chrome session)
  const liveMetaAcc = allAccounts.find(a => (a.isLive || a.email?.startsWith('meta_') || (a.status && a.status.includes('Live'))));
  const activeAcc = (liveMetaAcc && (liveMetaAcc.isLive || liveMetaAcc.email?.startsWith('meta_'))) 
    ? liveMetaAcc 
    : (allAccounts.find(a => a.apiKey === currentApiKey) || liveMetaAcc || allAccounts[0]);

  if (activeAcc && activeAcc.apiKey) {
    syncActiveApiKeyEverywhere(activeAcc.apiKey, activeAcc);
  }

  // Background sync any missing accounts to serverless backend
  if (serverAccounts.length < allAccounts.length) {
    for (const acc of allAccounts) {
      const k = getDedupeKey(acc);
      if (!serverAccounts.some(s => getDedupeKey(s) === k)) {
        fetch('/api/accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'sync', ...acc })
        }).catch(() => {});
      }
    }
  }

  // Calculate live count
  const liveCount = allAccounts.filter(a => a.isLive === true || (a.status && a.status.includes('Live'))).length;
  if (countLabel) countLabel.textContent = liveCount;
  if (totalAccEl) totalAccEl.textContent = allAccounts.length;
  if (liveAccEl) liveAccEl.textContent = liveCount;

  if (allAccounts.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding: 28px; color: var(--text-muted);">Chưa có tài khoản nào trong pool. Đăng nhập hoặc trích xuất Cookie ở Tab 1 để thêm vào hệ thống.</td></tr>`;
    return;
  }

  tbody.innerHTML = allAccounts.map(acc => {
    const isActive = (acc.apiKey && acc.apiKey === currentApiKey);
    const apiKeyPreview = acc.apiKeyPreview || (acc.apiKey ? `${acc.apiKey.slice(0, 10)}...${acc.apiKey.slice(-4)}` : 'Chưa có key');
    const remainingQuota = acc.quota ? Number(acc.quota.remaining).toLocaleString() : '1,000,000';
    const statusHtml = renderAccountStatusBadge(acc);
    const lastCheckedHtml = formatLastChecked(acc.lastChecked);
    const rowStyle = isActive ? 'background: rgba(16, 185, 129, 0.08); outline: 1px solid rgba(16, 185, 129, 0.35);' : '';

    return `
      <tr id="acc-row-${acc.id}" style="${rowStyle}">
        <td>
          <div style="display: flex; align-items: center; gap: 8px;">
            <strong>${acc.email}</strong>
            ${isActive ? '<span style="font-size: 10px; background: #10b981; color: #fff; padding: 2px 6px; border-radius: 4px; font-weight: 700;">ĐANG DÙNG</span>' : ''}
          </div>
        </td>
        <td><span class="status-tag active">${acc.plan || 'Pro'}</span></td>
        <td><code class="inline-code" title="${acc.apiKey || ''}" style="${isActive ? 'color: #10b981; font-weight: 700;' : ''}">${apiKeyPreview}</code></td>
        <td>${remainingQuota} tokens</td>
        <td class="status-cell">${statusHtml}</td>
        <td class="last-checked-cell">${lastCheckedHtml}</td>
        <td>
          <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
            <button class="btn-check-live" onclick="checkAccountLive('${acc.id}', '${acc.apiKey}')" title="Kiểm tra độ trễ và tính hợp lệ của Cookie">
              🔍 Check Live
            </button>
            <button class="btn-secondary" style="padding: 4px 8px; font-size: 11px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3);" onclick="updateAccountCookie('${acc.id}', '${acc.email}')" title="Nhập hoặc dán Cookie mới cho tài khoản này">
              🍪 Nạp Cookie
            </button>
            ${isActive 
              ? '<span style="padding: 4px 8px; font-size: 11px; color: #10b981; font-weight: 700;">✓ Đang dùng</span>' 
              : `<button class="btn-secondary" style="padding: 4px 8px; font-size: 11px;" onclick="useAccountAsActive('${acc.apiKey}')">Dùng key này</button>`}
            <button class="btn-secondary" style="padding: 4px 8px; font-size: 11px; color: #f87171;" onclick="deleteAccount('${acc.id}', '${acc.email}')">Xóa</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function updateAccountCookie(id, email) {
  const cookieStr = prompt(`🍪 Dán chuỗi Cookie mới (từ Chrome DevTools Application/Network hoặc Extension) cho tài khoản:\n${email}`);
  if (!cookieStr || !cookieStr.trim()) return;

  const list = getLocalAccounts();
  const acc = list.find(a => (id && a.id === id) || (email && a.email && a.email.toLowerCase().trim() === email.toLowerCase().trim()));
  if (acc) {
    acc.cookieString = cookieStr.trim();
    acc.status = 'Đang kiểm tra...';
    saveLocalAccounts(list);
  }

  showNotice(`Đang kiểm tra và lưu Cookie cho ${email}...`, 'info');

  try {
    const res = await fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'sync',
        id: acc?.id || id,
        email: email,
        apiKey: acc?.apiKey,
        cookieString: cookieStr.trim()
      })
    });
    const data = await res.json();
    if (data.success) {
      showNotice(`✅ Đã lưu Cookie! Đang ping live...`, 'success');
      await checkAccountLive(acc?.id || id, acc?.apiKey);
    } else {
      showNotice(data.error || 'Lỗi cập nhật Cookie', 'error');
    }
  } catch (err) {
    showNotice(`Lỗi: ${err.message}`, 'error');
  }
}

async function checkAccountLive(id, apiKey) {
  const localList = getLocalAccounts();
  const acc = localList.find(a => (id && a.id === id) || (apiKey && a.apiKey === apiKey));

  const row = document.getElementById(`acc-row-${id}`);
  let checkBtn = null;
  if (row) {
    checkBtn = row.querySelector('.btn-check-live');
    if (checkBtn) {
      checkBtn.disabled = true;
      checkBtn.innerHTML = '⏳ Đang ping...';
    }
  }

  try {
    const res = await fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'check',
        id: acc?.id || id,
        apiKey: acc?.apiKey || apiKey,
        email: acc?.email,
        cookies: acc?.cookies,
        cookieString: acc?.cookieString,
        plan: acc?.plan,
        quota: acc?.quota
      })
    });
    const data = await res.json();

    if (data.success && data.account) {
      const list = getLocalAccounts();
      const idx = list.findIndex(a => 
        a.id === (acc?.id || id) || 
        a.apiKey === (acc?.apiKey || apiKey) || 
        (acc?.email && a.email && a.email.toLowerCase().trim() === acc.email.toLowerCase().trim())
      );
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...data.account };
        saveLocalAccounts(list);
      }

      showNotice(data.message, data.account.isLive ? 'success' : 'error');
      loadAccountsList();
    } else {
      showNotice(data.error || 'Kiểm tra tài khoản thất bại', 'error');
    }
  } catch (err) {
    showNotice(`Lỗi kiểm tra live: ${err.message}`, 'error');
  } finally {
    if (checkBtn) {
      checkBtn.disabled = false;
      checkBtn.innerHTML = '🔍 Check Live';
    }
  }
}

async function checkAllAccountsLive() {
  const btn = document.getElementById('btnCheckAllLive');
  const originalHtml = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '⏳ Đang kiểm tra toàn bộ...';
  }

  try {
    const localList = getLocalAccounts();
    const res = await fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'check_all',
        accounts: localList
      })
    });
    const data = await res.json();

    if (data.success && Array.isArray(data.results)) {
      const list = getLocalAccounts();
      data.results.forEach(resAcc => {
        const idx = list.findIndex(a => 
          a.id === resAcc.id || 
          (resAcc.email && a.email && a.email.toLowerCase().trim() === resAcc.email.toLowerCase().trim())
        );
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...resAcc };
        }
      });
      saveLocalAccounts(list);

      showNotice(data.message, 'success');
      loadAccountsList();
    } else {
      showNotice(data.error || 'Kiểm tra tài khoản thất bại', 'error');
    }
  } catch (err) {
    showNotice(`Lỗi kiểm tra live: ${err.message}`, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    }
  }
}

async function deleteAccount(id, email) {
  if (!confirm(`Bạn có chắc muốn xóa tài khoản ${email || id} khỏi pool?`)) return;
  try {
    await fetch('/api/accounts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, email })
    });

    const list = getLocalAccounts().filter(a => 
      a.id !== id && (!email || a.email.toLowerCase().trim() !== email.toLowerCase().trim())
    );
    saveLocalAccounts(list);

    loadAccountsList();
    showNotice('Đã xóa tài khoản khỏi pool', 'info');
  } catch (e) {
    alert('Lỗi: ' + e.message);
  }
}

function syncActiveApiKeyEverywhere(apiKey, accountData = {}) {
  if (!apiKey) return;
  currentApiKey = apiKey;
  localStorage.setItem('muse_api_key', apiKey);

  // 1. Tab 1 - Tích hợp API (Active Key & Base URL)
  const displayKey = document.getElementById('displayApiKey');
  if (displayKey) displayKey.value = apiKey;

  const displayBase = document.getElementById('displayBaseUrl');
  if (displayBase) displayBase.value = currentBaseUrl;

  // 2. Tab 2 - Xưởng Phim Drama Muse (Header Key Pill)
  const dramaKeyEl = document.getElementById('dramaBoundApiKey');
  if (dramaKeyEl) {
    dramaKeyEl.textContent = `${apiKey.slice(0, 14)}...`;
    dramaKeyEl.title = apiKey;
  }

  // 3. Tab 1 - Active Status Badge
  const badge = document.getElementById('badgeActiveStatus');
  if (badge) {
    badge.className = 'status-tag active';
    badge.textContent = `Active (${accountData.plan || 'Pro / Unlimited'})`;
  }

  // 4. Tab 1 - Code Integration Snippets (NextChat, LobeChat, Cherry Studio)
  updateIntegrationCodes(apiKey);

  // 5. Tab 1 - Tokens & Quota (if provided)
  if (accountData.quota) {
    const q = accountData.quota;
    const quotaNumbers = document.getElementById('quotaNumbers');
    if (quotaNumbers && typeof q.remaining === 'number' && typeof q.total === 'number') {
      quotaNumbers.textContent = `${q.remaining.toLocaleString()} / ${q.total.toLocaleString()} tokens`;
    }
    const quotaFill = document.getElementById('quotaFill');
    if (quotaFill && typeof q.used === 'number' && typeof q.total === 'number' && q.total > 0) {
      const pct = Math.min(100, Math.round((q.used / q.total) * 100));
      quotaFill.style.width = `${pct}%`;
    }
  }

  if (accountData.cookies) {
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el && val) el.textContent = val;
    };
    setVal('valHatchSess', accountData.cookies.hatch_sess);
    setVal('valHatchGw', accountData.cookies.hatch_gw);
    setVal('valHatchVml', accountData.cookies.hatch_vml);
    setVal('valHatchDevice', accountData.cookies.hatch_native_auth_device);
  }
}

function useAccountAsActive(apiKey) {
  const localList = getLocalAccounts();
  const acc = localList.find(a => a.apiKey === apiKey) || {};
  syncActiveApiKeyEverywhere(apiKey, acc);
  loadAccountsList();
  showNotice('Đã đồng bộ và chuyển sang dùng API Key này!', 'success');
}

// ========================================================
// 🌐 CHROME AUTO-CONNECT & DIRECT BROWSER BRIDGE
// ========================================================
let isExtensionDetected = false;
let pendingChromeSyncResolve = null;

function initChromeAutoConnector() {
  const statusText = document.getElementById('chromeStatusText');

  if (document.documentElement.getAttribute('data-muse-extension-installed') === 'true' ||
      window.sessionStorage.getItem('muse_extension_installed') === 'true') {
    isExtensionDetected = true;
    if (statusText) statusText.textContent = '🟢 Tiện ích Chrome sẵn sàng';
  }

  // Listen for window messages from extension content script
  window.addEventListener('message', async (event) => {
    if (!event.data || event.source !== window) return;

    if (event.data.type === 'MUSE_EXTENSION_PING') {
      isExtensionDetected = true;
      if (statusText) statusText.textContent = '🟢 Tiện ích Chrome kết nối';
    }

    if (event.data.type === 'MUSE_SESSION_EXTRACTED' && event.data.apiKey) {
      syncActiveApiKeyEverywhere(event.data.apiKey, event.data.account);
      showNotice('🎉 Đã đồng bộ và kích hoạt API Key từ tab Muse AI!', 'success');
      loadAccountsList();
    }

    if (event.data.type === 'MUSE_CHROME_AUTO_DETECTED') {
      isExtensionDetected = true;
      if (statusText) statusText.textContent = '🟢 Phát hiện phiên Muse đang mở';
      const cookiesData = event.data.cookies || event.data.data?.cookies || {};
      const cookieStr = event.data.cookieString || event.data.data?.cookieString || '';
      
      if (!currentApiKey || currentApiKey.includes('your-api-key') || !localStorage.getItem('muse_api_key')) {
        await handleChromeSessionData({ cookieString: cookieStr, cookies: cookiesData });
      }
    }

    if (event.data.type === 'MUSE_CHROME_AUTO_SYNC_RESPONSE') {
      isExtensionDetected = true;
      if (pendingChromeSyncResolve) {
        pendingChromeSyncResolve(event.data);
        pendingChromeSyncResolve = null;
      }
    }
  });

  window.postMessage({ type: 'MUSE_EXTENSION_QUERY' }, '*');
}

async function triggerChromeAutoConnect() {
  const btn = document.getElementById('btnAutoConnectChrome');
  const originalText = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '⏳ Đang quét trình duyệt...';
  }
  showNotice('Đang dò tìm phiên Muse AI trên trình duyệt Chrome...', 'info');

  let syncResult = null;
  try {
    const promise = new Promise((resolve) => {
      pendingChromeSyncResolve = resolve;
      window.postMessage({ type: 'MUSE_CHROME_AUTO_SYNC_REQUEST' }, '*');
      setTimeout(() => {
        if (pendingChromeSyncResolve === resolve) {
          pendingChromeSyncResolve = null;
          resolve({ success: false, timeout: true });
        }
      }, 1400);
    });

    syncResult = await promise;
  } catch (e) {
    syncResult = { success: false, error: e.message };
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  }

  if (syncResult && syncResult.success && syncResult.cookieString) {
    await handleChromeSessionData(syncResult);
    showNotice('🎉 Đã tự động kết nối tài khoản Muse từ Chrome thành công!', 'success');
  } else {
    // Open the 1-Click DevTools Console Modal
    openDevToolsSnippetModal();
  }
}

async function handleChromeSessionData(data) {
  try {
    const res = await fetch('/api/auth/extract-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cookieString: data.cookieString,
        cookies: data.cookies,
        email: data.email || 'chrome_user@muse.ai'
      })
    });
    const result = await res.json();
    if (result.success) {
      handleAuthSuccess(result);
      const statusText = document.getElementById('chromeStatusText');
      if (statusText) statusText.textContent = '🟢 Đã kết nối phiên thật';
      showNotice(result.message || 'Đã kích hoạt API Key từ Chrome!', 'success');
    }
  } catch (err) {
    console.warn('Error handling chrome session data:', err);
  }
}

function openDevToolsSnippetModal() {
  const modal = document.getElementById('modalDevToolsSnippet');
  const codeArea = document.getElementById('consoleSnippetCode');
  if (modal) modal.style.display = 'flex';

  const gatewayUrl = window.location.origin;
  const snippet = `(async()=>{try{console.log('⏳ Đang kết nối với API Muse 2026...');const s=await(await fetch('/api/session?vm_state=live')).json().catch(()=>({}));const f=await(await fetch('/api/falco')).json().catch(()=>({}));const uid=f?.user?.identifier||('user_'+Date.now().toString(36));const res=await fetch('${gatewayUrl}/api/auth/extract-session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cookieString:document.cookie,email:f?.user?.email||\`meta_\${uid}@muse.ai\`,meta_user:f?.user,quota:s?.quota||{total:1000000,used:20000,remaining:980000},plan:'Pro / Unlimited',vm_state:s?.vm_state||'RUNNING'})});const d=await res.json();if(d.success){console.log('🎉 KẾT NỐI THÀNH CÔNG! API Key:', d.apiKey);try{if(window.opener){window.opener.postMessage({type:'MUSE_SESSION_EXTRACTED',apiKey:d.apiKey,account:d.account},'*');}}catch(_){}const b=document.createElement('div');b.innerHTML='🎉 ĐÃ KẾT NỐI THÀNH CÔNG VỚI API MUSE 2026!<br><strong style="font-size:15px;color:#fef08a;display:block;margin:6px 0;">API Key: '+d.apiKey+'</strong><div style="display:flex;gap:8px;justify-content:center;margin-top:6px;"><button onclick="navigator.clipboard.writeText(\\''+d.apiKey+'\\');this.innerText=\\'✓ Đã sao chép!\\'" style="background:#fff;color:#047857;border:none;padding:6px 14px;border-radius:6px;font-weight:700;cursor:pointer;">📋 Sao chép Key</button><a href="${gatewayUrl}/?activated_key='+d.apiKey+'" target="_blank" style="color:#fff;background:rgba(255,255,255,0.25);padding:6px 14px;border-radius:6px;text-decoration:none;font-weight:700;">👉 Mở Web App</a></div>';b.style.cssText='position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:999999;background:linear-gradient(135deg,#059669,#10b981);color:#fff;padding:18px 28px;border-radius:14px;font-size:14px;font-weight:600;box-shadow:0 16px 40px rgba(0,0,0,0.45);font-family:sans-serif;text-align:center;line-height:1.6;border:1px solid rgba(255,255,255,0.3);';document.body.appendChild(b);setTimeout(()=>b.remove(),15000);}else{console.error('Lỗi:',d.error);alert('Lỗi: '+(d.error||'Không thể kết nối'));}}catch(e){console.error('Lỗi:',e);alert('Lỗi: '+e.message);}})();`;

  if (codeArea) codeArea.value = snippet;
}

function closeDevToolsSnippetModal() {
  const modal = document.getElementById('modalDevToolsSnippet');
  if (modal) modal.style.display = 'none';
}

function copyConsoleSnippet() {
  const codeArea = document.getElementById('consoleSnippetCode');
  if (!codeArea) return;
  codeArea.select();
  navigator.clipboard.writeText(codeArea.value).then(() => {
    showNotice('📋 Đã sao chép mã! Hãy chuyển sang tab muse.ai -> Console -> Paste và gõ Enter.', 'success');
  }).catch(() => {
    document.execCommand('copy');
    showNotice('📋 Đã sao chép mã!', 'success');
  });
}

// Auto-refresh account pool when user switches back to this tab
window.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    loadAccountsList();
  }
});
window.addEventListener('focus', () => {
  loadAccountsList();
});

// ========================================================
// 📱 ANDROID QUICK-CONNECT & MOBILE SUITE
// ========================================================
function openAndroidConnectModal(initialTab = 'bookmarklet') {
  const modal = document.getElementById('modalAndroidConnect');
  if (!modal) return;
  modal.style.display = 'flex';

  // 1. Prepare Android Bookmarklet Code
  const gateway = window.location.origin;
  const bookmarklet = `javascript:(async()=>{try{const g='${gateway}';const t=document.createElement('div');t.innerHTML='⏳ <strong>Đang kết nối Muse AI trên Android...</strong>';t.style.cssText='position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:9999999;background:#0f172a;color:#38bdf8;border:2px solid #38bdf8;padding:14px 20px;border-radius:12px;font-size:14px;font-weight:600;font-family:sans-serif;box-shadow:0 12px 30px rgba(0,0,0,0.6);text-align:center;width:85%;max-width:360px;';document.body.appendChild(t);const s=await(await fetch('/api/session?vm_state=live')).json().catch(()=>({}));const f=await(await fetch('/api/falco')).json().catch(()=>({}));const uid=f?.user?.identifier||('android_'+Date.now().toString(36));const r=await fetch(g+'/api/auth/extract-session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cookieString:document.cookie,email:f?.user?.email||('meta_'+uid+'@muse.ai'),meta_user:f?.user,quota:s?.quota||{total:1000000,used:20000,remaining:980000},plan:'Pro / Unlimited',vm_state:s?.vm_state||'RUNNING'})});const d=await r.json();if(d.success){try{navigator.vibrate&&navigator.vibrate([100,50,100]);}catch(_){}t.style.borderColor='#10b981';t.style.color='#10b981';t.innerHTML='🎉 <strong>KẾT NỐI ANDROID THÀNH CÔNG!</strong><br><small style="color:#fff;display:block;margin:6px 0;">API Key: '+d.apiKey.slice(0,16)+'...<\/small><span style="font-size:12px;color:#a7f3d0;">Đang chuyển về Web App...<\/span>';setTimeout(()=>{window.location.href=g+'/?activated_key='+encodeURIComponent(d.apiKey)+'&from=android';},1400);}else{t.style.borderColor='#ef4444';t.style.color='#ef4444';t.innerHTML='❌ Lỗi: '+(d.error||'Không thể kết nối');setTimeout(()=>t.remove(),4000);}}catch(e){alert('Lỗi: '+e.message);}})();`;

  const codeArea = document.getElementById('androidBookmarkletCode');
  if (codeArea) codeArea.value = bookmarklet;

  // 2. Prepare QR Sync Link
  const activeKey = currentApiKey || 'sk-muse-default';
  const syncUrl = `${gateway}/?activated_key=${encodeURIComponent(activeKey)}&from=qr_sync`;
  const qrImg = document.getElementById('androidQrImage');
  if (qrImg) {
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=8&data=${encodeURIComponent(syncUrl)}`;
  }
  const urlPreview = document.getElementById('androidQrUrlPreview');
  if (urlPreview) urlPreview.textContent = syncUrl;

  switchAndroidSubtab(initialTab);
}

function closeAndroidConnectModal() {
  const modal = document.getElementById('modalAndroidConnect');
  if (modal) modal.style.display = 'none';
}

function switchAndroidSubtab(tabName) {
  const tabs = ['bookmarklet', 'qr', 'kiwi'];
  tabs.forEach(name => {
    const btn = document.getElementById(`btnAndroidTab${name === 'bookmarklet' ? 'Bookmarklet' : name === 'qr' ? 'QR' : 'Kiwi'}`);
    const pane = document.getElementById(`androidPane${name === 'bookmarklet' ? 'Bookmarklet' : name === 'qr' ? 'QR' : 'Kiwi'}`);
    if (btn) btn.classList.toggle('active', name === tabName);
    if (pane) pane.style.display = (name === tabName) ? 'block' : 'none';
  });
}

function copyAndroidBookmarklet() {
  const codeArea = document.getElementById('androidBookmarkletCode');
  if (!codeArea) return;
  codeArea.select();
  navigator.clipboard.writeText(codeArea.value).then(() => {
    showNotice('📋 Đã sao chép Bookmarklet! Hãy tạo Dấu trang trên Chrome Android và dán mã này vào URL.', 'success');
  }).catch(() => {
    document.execCommand('copy');
    showNotice('📋 Đã sao chép mã Bookmarklet!', 'success');
  });
}

function copyAndroidSyncUrl() {
  const urlPreview = document.getElementById('androidQrUrlPreview');
  const text = urlPreview ? urlPreview.textContent : window.location.href;
  navigator.clipboard.writeText(text).then(() => {
    showNotice('🔗 Đã sao chép link đồng bộ Android!', 'success');
  }).catch(() => {
    prompt('Link đồng bộ Android của bạn:', text);
  });
}

function openAndroidSyncLinkNewTab() {
  const urlPreview = document.getElementById('androidQrUrlPreview');
  if (urlPreview && urlPreview.textContent) {
    window.open(urlPreview.textContent, '_blank');
  }
}

// ========================================================
// 🧠 STANFORD CS229 & BPE TOKEN ESTIMATION CLIENT HELPERS
// ========================================================
let currentDecodingPreset = 'balanced';
let currentTemperature = 0.7;
let currentTopP = 0.9;

function estimateBpeTokensClient(text) {
  if (!text || typeof text !== 'string') return 0;
  const vietnameseAccents = (text.match(/[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđĐ]/gi) || []).length;
  const syntaxSymbols = (text.match(/[{}\[\]();:<>=!&|+\-*\/\\~^%$#@`"'.,\n]/g) || []).length;
  const words = text.trim().split(/\s+/).filter(Boolean);
  let tokens = 0;
  if (vietnameseAccents > 0) {
    tokens = Math.ceil(words.length * 1.45) + Math.ceil(vietnameseAccents * 0.45) + Math.ceil(syntaxSymbols * 0.5);
  } else {
    tokens = Math.ceil(words.length * 1.25) + Math.ceil(syntaxSymbols * 0.4);
  }
  const byteLen = new Blob([text]).size;
  return Math.max(1, Math.max(tokens, Math.ceil(byteLen / 3.4)));
}

function onChatInputChanged(val) {
  const badge = document.getElementById('liveTokenBadge');
  if (!badge) return;
  const tokens = val ? estimateBpeTokensClient(val) : 0;
  badge.textContent = `⚡ BPE: ~${tokens} tokens`;
  badge.classList.toggle('warning', tokens > 500);
}

function applyDecodingPreset(preset) {
  currentDecodingPreset = preset;
  const pillDet = document.getElementById('pillDet');
  const pillBal = document.getElementById('pillBal');
  const pillCre = document.getElementById('pillCre');
  const pillCus = document.getElementById('pillCus');
  const customBox = document.getElementById('customDecodingBox');

  [pillDet, pillBal, pillCre, pillCus].forEach(p => p && p.classList.remove('active'));
  if (customBox) customBox.style.display = 'none';

  if (preset === 'deterministic') {
    pillDet?.classList.add('active');
    currentTemperature = 0.1;
    currentTopP = 0.1;
  } else if (preset === 'balanced') {
    pillBal?.classList.add('active');
    currentTemperature = 0.7;
    currentTopP = 0.9;
  } else if (preset === 'creative') {
    pillCre?.classList.add('active');
    currentTemperature = 1.1;
    currentTopP = 0.95;
  }

  updateDecodingLabels();
}

function toggleCustomDecoding() {
  const customBox = document.getElementById('customDecodingBox');
  const pillCus = document.getElementById('pillCus');
  const pillDet = document.getElementById('pillDet');
  const pillBal = document.getElementById('pillBal');
  const pillCre = document.getElementById('pillCre');

  [pillDet, pillBal, pillCre].forEach(p => p && p.classList.remove('active'));
  pillCus?.classList.add('active');

  currentDecodingPreset = 'custom';
  if (customBox) {
    customBox.style.display = customBox.style.display === 'none' ? 'flex' : 'none';
  }
  updateDecodingLabels();
}

function onTempSliderChange(val) {
  currentTemperature = parseFloat(val);
  const valEl = document.getElementById('valTemp');
  if (valEl) valEl.textContent = currentTemperature.toFixed(2);
  currentDecodingPreset = 'custom';
  updateDecodingLabels();
}

function onTopPSliderChange(val) {
  currentTopP = parseFloat(val);
  const valEl = document.getElementById('valTopP');
  if (valEl) valEl.textContent = currentTopP.toFixed(2);
  currentDecodingPreset = 'custom';
  updateDecodingLabels();
}

function updateDecodingLabels() {
  const label = document.getElementById('currentDecodingLabel');
  if (!label) return;
  const presetNames = {
    deterministic: 'Chính xác (Argmax)',
    balanced: 'Cân bằng',
    creative: 'Sáng tạo (High Entropy)',
    custom: 'Tùy chỉnh'
  };
  label.textContent = `🎯 T: ${currentTemperature.toFixed(2)} | P: ${currentTopP.toFixed(2)} (${presetNames[currentDecodingPreset] || 'Custom'})`;
  const valTemp = document.getElementById('valTemp');
  const valTopP = document.getElementById('valTopP');
  const inputTemp = document.getElementById('inputTemp');
  const inputTopP = document.getElementById('inputTopP');
  if (valTemp) valTemp.textContent = currentTemperature.toFixed(2);
  if (valTopP) valTopP.textContent = currentTopP.toFixed(2);
  if (inputTemp) inputTemp.value = currentTemperature;
  if (inputTopP) inputTopP.value = currentTopP;
}

function onModelOrPersonaChange() {
  const model = document.getElementById('pgModel')?.value;
  if (model === 'muse-coder') {
    applyDecodingPreset('deterministic');
  } else if (model === 'muse-analyst') {
    applyDecodingPreset('deterministic');
  } else if (model === 'muse-creative') {
    applyDecodingPreset('creative');
  } else if (model === 'muse-researcher') {
    currentTemperature = 0.3;
    currentTopP = 0.4;
    currentDecodingPreset = 'custom';
    updateDecodingLabels();
  } else {
    applyDecodingPreset('balanced');
  }
  updateContextHealthMonitor();
}

function updateContextHealthMonitor() {
  const badge = document.getElementById('ctxHealthBadge');
  const fill = document.getElementById('ctxUsageFill');
  const msgCountEl = document.getElementById('ctxMsgCount');
  const tokensEl = document.getElementById('ctxTokensUsage');

  let totalTokens = 3;
  for (const m of chatHistory) {
    totalTokens += 4 + estimateBpeTokensClient(m.content || '');
  }

  const maxBudget = 16384;
  const percentage = Math.min(100, Math.round((totalTokens / maxBudget) * 100));

  if (fill) {
    fill.style.width = `${Math.max(4, percentage)}%`;
    if (percentage > 85) fill.style.background = '#ef4444';
    else if (percentage > 60) fill.style.background = '#f59e0b';
    else fill.style.background = '#10b981';
  }

  if (badge) {
    if (percentage > 85) {
      badge.textContent = '⚠️ Quá tải Attention';
      badge.style.color = '#ef4444';
    } else if (percentage > 60) {
      badge.textContent = '🟡 Cảnh báo O(T²)';
      badge.style.color = '#f59e0b';
    } else {
      badge.textContent = '🟢 Khỏe mạnh';
      badge.style.color = '#34d399';
    }
  }

  if (msgCountEl) msgCountEl.textContent = `${chatHistory.length} tin nhắn`;
  if (tokensEl) tokensEl.textContent = `~${totalTokens.toLocaleString()} / ${maxBudget.toLocaleString()} tokens (${percentage}%)`;
}

// 6. AI Playground (Streaming Chat & Image Gen)
function initPlayground() {
  const form = document.getElementById('chatForm');
  const input = document.getElementById('chatInput');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || isGenerating) return;

    input.value = '';
    onChatInputChanged('');
    appendChatMessage('user', text);
    chatHistory.push({ role: 'user', content: text });

    // Client-side Sliding Window Context Pruning (Preserve system prompt + max 20 messages)
    if (chatHistory.length > 20) {
      const systemMsgs = chatHistory.filter(m => m.role === 'system');
      const nonSystemMsgs = chatHistory.filter(m => m.role !== 'system');
      chatHistory = [...systemMsgs, ...nonSystemMsgs.slice(-18)];
    }
    updateContextHealthMonitor();

    const model = document.getElementById('pgModel').value;
    const isStream = document.getElementById('pgStream').checked;

    isGenerating = true;
    const sendBtn = document.getElementById('btnSendChat');
    sendBtn.disabled = true;

    // Create assistant message container
    const assistantMsgEl = appendChatMessage('assistant', '');
    const bubble = assistantMsgEl.querySelector('.msg-bubble');

    try {
      const response = await fetch('/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentApiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: chatHistory,
          stream: isStream,
          temperature: currentTemperature,
          top_p: currentTopP,
          preset: currentDecodingPreset
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `HTTP ${response.status}`);
      }

      if (isStream) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let fullReply = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6).trim();
              if (dataStr === '[DONE]') continue;
              try {
                const parsed = JSON.parse(dataStr);
                const delta = parsed.choices?.[0]?.delta?.content || '';
                fullReply += delta;
                bubble.innerHTML = renderMarkdown(fullReply);
                scrollChatToBottom();
              } catch {}
            }
          }
        }
        chatHistory.push({ role: 'assistant', content: fullReply });
      } else {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        bubble.innerHTML = renderMarkdown(content);
        chatHistory.push({ role: 'assistant', content });
        scrollChatToBottom();
      }
      updateContextHealthMonitor();
    } catch (err) {
      bubble.textContent = `❌ Lỗi API: ${err.message}`;
    } finally {
      isGenerating = false;
      sendBtn.disabled = false;
    }
  });
}

function appendChatMessage(role, text) {
  const container = document.getElementById('chatMessages');
  const msg = document.createElement('div');
  msg.className = `message ${role}`;
  msg.innerHTML = `<div class="msg-bubble">${renderMarkdown(text)}</div>`;
  container.appendChild(msg);
  scrollChatToBottom();
  return msg;
}

function scrollChatToBottom() {
  const container = document.getElementById('chatMessages');
  container.scrollTop = container.scrollHeight;
}

function clearPlaygroundChat() {
  chatHistory = [];
  document.getElementById('chatMessages').innerHTML = `
    <div class="message system">
      <div class="msg-bubble">
        👋 Lịch sử chat đã được xóa. Hãy nhập tin nhắn bên dưới để tiếp tục.
      </div>
    </div>
  `;
  updateContextHealthMonitor();
}

function setPlaygroundMode(mode) {
  const btnChat = document.getElementById('btnModeChat');
  const btnImg = document.getElementById('btnModeImage');
  const paneChat = document.getElementById('pgChatPane');
  const paneImg = document.getElementById('pgImagePane');

  if (mode === 'chat') {
    btnChat.classList.add('active');
    btnImg.classList.remove('active');
    paneChat.style.display = 'flex';
    paneImg.style.display = 'none';
  } else {
    btnImg.classList.add('active');
    btnChat.classList.remove('active');
    paneChat.style.display = 'none';
    paneImg.style.display = 'flex';
  }
}

async function generateImage() {
  const promptInput = document.getElementById('imagePrompt');
  const prompt = promptInput.value.trim();
  const btn = document.getElementById('btnGenImage');
  const container = document.getElementById('imageResultContainer');

  if (!prompt) {
    alert('Vui lòng nhập mô tả ảnh (prompt)!');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Đang vẽ ảnh với Muse AI... ⏳';

  try {
    const res = await fetch('/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentApiKey}`
      },
      body: JSON.stringify({ prompt, n: 1 })
    });

    const data = await res.json();
    if (data.data && data.data[0]) {
      const card = document.createElement('div');
      card.className = 'image-card';
      card.innerHTML = `
        <img src="${data.data[0].url}" alt="${prompt}" loading="lazy">
        <div style="padding: 10px; font-size: 12px; color: var(--text-muted);">
          <p><strong>Prompt:</strong> ${prompt}</p>
          <a href="${data.data[0].url}" target="_blank" style="color: var(--primary); text-decoration: none; display: inline-block; margin-top: 6px;">Mở ảnh gốc ↗</a>
        </div>
      `;
      container.prepend(card);
    } else {
      alert('Không nhận được ảnh: ' + (data.error?.message || 'Unknown error'));
    }
  } catch (e) {
    alert('Lỗi tạo ảnh: ' + e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Tạo ảnh AI 🎨';
  }
}

// 7. Utility Functions
function copyField(elementId) {
  const input = document.getElementById(elementId);
  if (!input) return;

  input.select();
  navigator.clipboard.writeText(input.value).then(() => {
    const btn = event?.target;
    if (btn) {
      const oldText = btn.textContent;
      btn.textContent = 'Copied! ✅';
      setTimeout(() => { btn.textContent = oldText; }, 1500);
    }
  }).catch(() => {
    document.execCommand('copy');
  });
}

function toggleTokensAccordion() {
  const content = document.getElementById('tokensAccordionContent');
  const arrow = document.getElementById('accordionArrow');
  const isHidden = content.hidden;
  content.hidden = !isHidden;
  arrow.textContent = isHidden ? '▲' : '▼';
}

function showNotice(msg, type) {
  const box = document.getElementById('authNotice');
  if (box) {
    if (!msg) {
      box.hidden = true;
    } else {
      box.hidden = false;
      box.className = `alert-box ${type}`;
      box.textContent = msg;
    }
  }

  // Floating Toast Notification for multi-tab user experience
  if (msg) {
    let toast = document.getElementById('appFloatingToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'appFloatingToast';
      document.body.appendChild(toast);
    }
    const colorStyles = {
      success: 'background: rgba(6, 78, 59, 0.95); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4);',
      error: 'background: rgba(127, 29, 29, 0.95); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4);',
      info: 'background: rgba(30, 58, 138, 0.95); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.4);'
    };
    const baseStyle = 'position: fixed; bottom: 24px; right: 24px; z-index: 9999; padding: 12px 20px; border-radius: 10px; font-size: 13px; font-weight: 600; box-shadow: 0 8px 24px rgba(0,0,0,0.5); display: flex; align-items: center; gap: 8px; transition: all 0.3s ease; opacity: 1; transform: translateY(0); ';
    toast.style.cssText = baseStyle + (colorStyles[type] || colorStyles.info);
    toast.innerHTML = msg;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px)';
    }, 4000);
  }
}

function setButtonLoading(btn, isLoading) {
  const text = btn.querySelector('.btn-text');
  const spinner = btn.querySelector('.spinner');
  btn.disabled = isLoading;
  if (text) text.style.opacity = isLoading ? '0.7' : '1';
  if (spinner) spinner.hidden = !isLoading;
}

function renderMarkdown(text) {
  if (!text) return '';
  // Basic markdown sanitizer and renderer for code blocks and bold
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks ```code```
  html = html.replace(/```([a-z0-9]*)\n([\s\S]*?)```/gi, (_, lang, code) => {
    return `<pre><code class="code-block">${code}</code></pre>`;
  });

  // Inline code `code`
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // Bold **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Newlines
  html = html.replace(/\n/g, '<br>');

  return html;
}


// ========================================================
// 🎬 VIETNAMESE DRAMA MUSE STUDIO PIPELINE CONTROLLER
// ========================================================
let currentDramaProduction = null;
let currentRecordedVideoBlob = null;
let isPipelineRunning = false;
let canvasAnimId = null;
let isCanvasPlaying = false;
let currentSceneIndex = 0;
let sceneTimeElapsed = 0;

const DRAMA_IDEAS_POOL = [
  "Chàng rể lái xe ôm công nghệ bị cả dòng họ vợ sỉ nhục trong tiệc mừng thọ, thực chất là người thừa kế duy nhất của đế chế nghìn tỷ.",
  "Cô con dâu nghèo bị mẹ chồng ép ký giấy từ con và đuổi đi trong đêm mưa, 3 năm sau trở lại với tư cách Chủ tịch tập đoàn mua lại toàn bộ công ty gia đình chồng.",
  "Người mẹ đơn thân nhặt ve chai nuôi con trai vào đại học, ngày cưới con lại bị mẹ vợ cấm không cho bước vào sảnh chính nhà hàng.",
  "Nữ chủ tịch giả danh nhân viên tập sự để thử lòng vị hôn phu, vạch trần bộ mặt thật của kẻ bắt cá hai tay ngay trước thềm đám cưới.",
  "Hai chị em sinh đôi bị tráo đổi số phận từ nhỏ ở vùng quê nghèo, sau 20 năm gặp lại tại phiên tòa phân chia thừa kế nghìn tỷ."
];

function goToDramaStudioWithKey() {
  switchTab('tab-drama');
  const dramaKeyEl = document.getElementById('dramaBoundApiKey');
  if (dramaKeyEl && currentApiKey) {
    dramaKeyEl.textContent = `${currentApiKey.slice(0, 14)}...`;
    dramaKeyEl.title = currentApiKey;
  }
  const ideaEl = document.getElementById('dramaIdea');
  if (ideaEl && !ideaEl.value.trim()) {
    suggestDramaIdeas();
  }
}

function suggestDramaIdeas() {
  const randomIdea = DRAMA_IDEAS_POOL[Math.floor(Math.random() * DRAMA_IDEAS_POOL.length)];
  const el = document.getElementById('dramaIdea');
  if (el) el.value = randomIdea;
}

function switchDramaSubtab(tabId) {
  document.querySelectorAll('.drama-subtab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('onclick')?.includes(tabId));
  });
  document.querySelectorAll('.drama-pane').forEach(pane => {
    pane.classList.toggle('active', pane.id === tabId);
  });
}

function updatePipelineStep(stepNumber, state) {
  const el = document.getElementById(`step${stepNumber}`);
  if (!el) return;
  el.classList.remove('active', 'completed');
  if (state === 'active') {
    el.classList.add('active');
  } else if (state === 'completed') {
    el.classList.add('completed');
    const icon = el.querySelector('.step-icon');
    if (icon) icon.textContent = '✓';
  }
  const label = document.getElementById('pipelineProgressLabel');
  if (label && state === 'completed') {
    label.textContent = `${stepNumber} / 7 Hoàn tất`;
  }
}

async function startDramaFullPipeline() {
  if (isPipelineRunning) return;

  const idea = document.getElementById('dramaIdea')?.value.trim() || DRAMA_IDEAS_POOL[0];
  const genre = document.getElementById('dramaGenre')?.value || 'Tổng tài ngầm / Bí mật thân phận';
  const durationMinutes = parseInt(document.getElementById('dramaDuration')?.value || '5', 10);
  const narratorAccent = document.getElementById('dramaAccent')?.value || 'Nam Bắc Bộ 45 tuổi';
  const ending = document.getElementById('dramaEnding')?.value || 'Nhân quả xứng đáng';

  const btn = document.getElementById('btnStartPipeline');
  const btnText = document.getElementById('btnPipelineText');

  isPipelineRunning = true;
  btn.disabled = true;
  btnText.textContent = 'Đang sản xuất phim Drama... ⏳';

  // Reset steps
  for (let s = 1; s <= 7; s++) {
    const el = document.getElementById(`step${s}`);
    if (el) {
      el.classList.remove('active', 'completed');
      const icon = el.querySelector('.step-icon');
      if (icon) icon.textContent = String(s);
    }
  }

  try {
    // BƯỚC 1: Khởi tạo kịch bản với API Key Muse
    updatePipelineStep(1, 'active');
    
    const response = await fetch('/api/drama/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentApiKey || 'sk-muse-default'}`
      },
      body: JSON.stringify({
        idea,
        genre,
        durationMinutes,
        narratorAccent,
        ending,
        apiKey: currentApiKey
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Lỗi HTTP ${response.status}`);
    }

    const data = await response.json();
    currentDramaProduction = data;
    updatePipelineStep(1, 'completed');

    // BƯỚC 2: Tối ưu 20+ Prompts Muse IVS
    updatePipelineStep(2, 'active');
    renderDramaPrompts(data.prompts || []);
    renderDramaStory(data.title, data.storyMarkdown);
    await delay(400);
    updatePipelineStep(2, 'completed');

    // BƯỚC 3: Tạo phụ đề chuẩn SRT millisecond
    updatePipelineStep(3, 'active');
    renderDramaSubtitles(data.srtContent || '');
    await delay(400);
    updatePipelineStep(3, 'completed');

    // BƯỚC 4: Vẽ ảnh Storyboard Keyframes (qua Muse Image API)
    updatePipelineStep(4, 'active');
    await renderDramaStoryboard(data.scenes || []);
    updatePipelineStep(4, 'completed');

    // BƯỚC 5: Lồng tiếng AI Voice
    updatePipelineStep(5, 'active');
    renderDramaVoiceTracks(data.scenes || []);
    await delay(500);
    updatePipelineStep(5, 'completed');

    // BƯỚC 6: Dựng phim & Ghép hiệu ứng Ken Burns
    updatePipelineStep(6, 'active');
    await composeAndRenderVideo(data.scenes || []);
    updatePipelineStep(6, 'completed');

    // BƯỚC 7: Xuất bản Video Thành Phẩm
    updatePipelineStep(7, 'completed');
    switchDramaSubtab('dsub-video');
    alert(`🎉 Chúc mừng! Bộ phim drama "${data.title}" đã được sản xuất và xuất bản video thành công!`);

  } catch (err) {
    alert('Lỗi sản xuất phim: ' + err.message);
  } finally {
    isPipelineRunning = false;
    btn.disabled = false;
    btnText.textContent = '🚀 TẠO PHIM DRAMA TRỌN GÓI';
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Render subtab contents
function renderDramaPrompts(prompts) {
  const countEl = document.getElementById('dramaPromptsCount');
  if (countEl) countEl.textContent = `${prompts.length} Prompts Muse AI chuẩn IVS`;
  const listEl = document.getElementById('dramaPromptsList');
  if (!listEl) return;

  listEl.innerHTML = prompts.map((p, idx) => `
    <div class="prompt-item">
      <button type="button" class="btn-copy-mini" onclick="copyPromptItem(${idx})">Copy</button>
      <div id="drama_p_${idx}">${p}</div>
    </div>
  `).join('');
}

function copyPromptItem(idx) {
  const el = document.getElementById(`drama_p_${idx}`);
  if (!el) return;
  navigator.clipboard.writeText(el.textContent).then(() => {
    alert(`Đã copy Prompt ${idx + 1}!`);
  });
}

function copyAllDramaPrompts() {
  if (!currentDramaProduction || !currentDramaProduction.prompts) return;
  navigator.clipboard.writeText(currentDramaProduction.prompts.join('\n\n')).then(() => {
    alert(`Đã copy toàn bộ ${currentDramaProduction.prompts.length} prompts Muse AI!`);
  });
}

function renderDramaStory(title, markdown) {
  const titleEl = document.getElementById('dramaStoryTitle');
  const textEl = document.getElementById('dramaStoryMarkdown');
  if (titleEl) titleEl.textContent = title || 'Kịch bản Drama';
  if (textEl) textEl.value = markdown || '';
}

function renderDramaSubtitles(srtText) {
  const el = document.getElementById('dramaSrtText');
  if (el) el.value = srtText || '';
}

function downloadSrtDirect() {
  const srt = document.getElementById('dramaSrtText')?.value;
  if (!srt) return alert('Chưa có nội dung phụ đề!');
  const blob = new Blob([srt], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${currentDramaProduction?.title || 'drama'}_subtitles.srt`;
  a.click();
}

async function renderDramaStoryboard(scenes) {
  const countEl = document.getElementById('sbCount');
  const gridEl = document.getElementById('dramaStoryboardGrid');
  if (countEl) countEl.textContent = `${scenes.length} hình ảnh phân cảnh`;
  if (!gridEl) return;

  gridEl.innerHTML = scenes.map(s => `
    <div class="sb-card">
      <div class="sb-img-wrapper">
        <span class="sb-badge">Clip ${s.clipNumber}</span>
        <img src="${s.imageUrl}" alt="Phân cảnh ${s.clipNumber}" loading="lazy" onerror="this.onerror=null;this.src='/api/drama/image?scene=${s.clipNumber}&title=${encodeURIComponent(s.sceneName || '')}'">
      </div>
      <div class="sb-content">
        <div class="sb-scene-title">${s.sceneName}</div>
        <div class="sb-voice-preview">"${s.narration.slice(0, 50)}..."</div>
        <div style="margin-top: 8px; display: flex; gap: 6px;">
          <a href="${s.imageUrl}" target="_blank" class="btn-copy-mini" style="text-decoration:none; display:inline-block; font-size:11px;">🔍 Xem HD</a>
          <button type="button" class="btn-copy-mini" onclick="copyPromptItem(${s.clipNumber - 1})" style="font-size:11px;">📋 Prompt</button>
        </div>
      </div>
    </div>
  `).join('');
}

function renderDramaVoiceTracks(scenes) {
  const listEl = document.getElementById('dramaVoiceList');
  if (!listEl) return;

  listEl.innerHTML = scenes.map(s => `
    <div class="voice-track-item">
      <div class="voice-track-info">
        <span class="voice-actor-tag">🎙️ NARRATOR_001 (MC Lời bình) - Phân cảnh ${s.clipNumber}</span>
        <span class="voice-track-text">"${s.narration}"</span>
        ${s.dialogue ? `<span class="voice-actor-tag" style="color: #38bdf8; margin-top: 4px;">💬 ${s.dialogueOwner} (Thoại): "${s.dialogue}"</span>` : ''}
      </div>
      <button type="button" class="btn-player" onclick="speakText('${escapeQuotes(s.narration + ' ' + (s.dialogue || ''))}')">
        🔊 Nghe thử
      </button>
    </div>
  `).join('');
}

function escapeQuotes(str) {
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function speakText(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'vi-VN';
  utterance.rate = 1.0;
  window.speechSynthesis.speak(utterance);
}

function speakAllScenesSequentially() {
  if (!currentDramaProduction || !currentDramaProduction.scenes) return;
  const fullText = currentDramaProduction.scenes.map(s => s.narration + '. ' + (s.dialogue ? s.dialogueOwner + ' nói: ' + s.dialogue : '')).join('. ');
  speakText(fullText);
}

// ========================================================
// 🎬 CINEMATIC VIDEO COMPOSER & MEDIA RECORDER ENGINE
// ========================================================
let audioCtx = null;
let currentBgmNode = null;

function initAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playDramaticDrone(durationSec) {
  try {
    initAudioContext();
    if (currentBgmNode) {
      try { currentBgmNode.stop(); } catch {}
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(65.41, audioCtx.currentTime); // C2 low dramatic drone
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(220, audioCtx.currentTime);

    gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 1.5);
    gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + durationSec);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + durationSec);
    currentBgmNode = osc;
  } catch (e) {
    console.warn('WebAudio BGM note:', e);
  }
}

function drawProceduralScene(ctx, width, height, sceneNum, progress) {
  const seed = ((sceneNum - 1) % 6) + 1;
  const zoom = 1.0 + progress * 0.08;
  const panX = Math.sin(progress * Math.PI) * 15;

  ctx.save();
  ctx.translate(width / 2 + panX, height / 2);
  ctx.scale(zoom, zoom);
  ctx.translate(-width / 2, -height / 2);

  if (seed === 1) {
    // Luxury Banquet Hall (Sảnh tiệc xa hoa)
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#1c1106');
    bgGrad.addColorStop(0.5, '#2a1b0c');
    bgGrad.addColorStop(1, '#0a0703');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Chandelier Glow
    const glow = ctx.createRadialGradient(width / 2, 80, 20, width / 2, 80, 450);
    glow.addColorStop(0, 'rgba(245, 158, 11, 0.55)');
    glow.addColorStop(0.5, 'rgba(217, 119, 6, 0.18)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    // Table & Pillars
    ctx.fillStyle = '#1e1710';
    ctx.fillRect(80, 0, 100, height);
    ctx.fillRect(width - 180, 0, 100, height);

    ctx.fillStyle = '#17120a';
    ctx.beginPath();
    ctx.ellipse(width / 2, height - 80, width * 0.48, 140, 0, 0, Math.PI * 2);
    ctx.fill();

  } else if (seed === 2) {
    // Dramatic Shards / Rain Tension
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#0a0e17');
    bgGrad.addColorStop(0.6, '#1e1b2e');
    bgGrad.addColorStop(1, '#05070a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Blue Cold Spotlight
    const spot = ctx.createRadialGradient(width / 2, height - 120, 30, width / 2, height - 120, 320);
    spot.addColorStop(0, 'rgba(56, 189, 248, 0.3)');
    spot.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = spot;
    ctx.fillRect(0, 0, width, height);

    // Red spilled wine
    ctx.fillStyle = 'rgba(127, 29, 29, 0.65)';
    ctx.beginPath();
    ctx.ellipse(width / 2, height - 130, 90, 25, 0, 0, Math.PI * 2);
    ctx.fill();

  } else if (seed === 3) {
    // Night Skyline Balcony
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#030712');
    bgGrad.addColorStop(0.6, '#0b1329');
    bgGrad.addColorStop(1, '#02040a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Skyscrapers silhouettes
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(320, 160, 120, height);
    ctx.fillRect(720, 200, 100, height);
    ctx.fillRect(840, 240, 140, height);

    // Neon Window Dots
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(360, 220, 6, 6);
    ctx.fillStyle = '#00d2ff';
    ctx.fillRect(390, 260, 6, 6);
    ctx.fillStyle = '#ec4899';
    ctx.fillRect(750, 240, 6, 6);

    // Balcony Silhouetted Man
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.arc(width / 2, 420, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(width / 2 - 45, 460, 90, height);

    // Glowing phone
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(width / 2 + 35, 440, 14, 24);

  } else if (seed === 4) {
    // Executive Desk & Legal Contract
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#140f07');
    bgGrad.addColorStop(0.5, '#24180a');
    bgGrad.addColorStop(1, '#0a0703');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Desk Lamp Glow
    const glow = ctx.createRadialGradient(width / 2, 220, 20, width / 2, 220, 380);
    glow.addColorStop(0, 'rgba(254, 240, 138, 0.35)');
    glow.addColorStop(0.6, 'rgba(202, 138, 4, 0.12)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    // Desk & Contract papers
    ctx.fillStyle = '#1c1208';
    ctx.fillRect(200, 360, width - 400, height);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(width / 2 - 120, 420, 260, 240);

    // Red seal
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(width / 2 + 60, 560, 28, 0, Math.PI * 2);
    ctx.fill();

  } else if (seed === 5) {
    // Sunrise Victory
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#451a03');
    bgGrad.addColorStop(0.4, '#b45309');
    bgGrad.addColorStop(0.7, '#f59e0b');
    bgGrad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Giant Sun
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(width / 2, 380, 140, 0, Math.PI * 2);
    ctx.fill();

    // Window Architecture
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(220, 0, 16, height);
    ctx.fillRect(width / 2 - 8, 0, 16, height);
    ctx.fillRect(width - 240, 0, 16, height);

  } else {
    // Rainy Room
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#18120c');
    bgGrad.addColorStop(0.6, '#261b11');
    bgGrad.addColorStop(1, '#0d0804');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Window with rain
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(width - 480, 100, 360, 320);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 6;
    ctx.strokeRect(width - 480, 100, 360, 320);
  }

  ctx.restore();
}

function drawWrappedSubtitle(ctx, text, x, y, maxWidth, lineHeight, textColor) {
  if (!text) return;
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  ctx.font = 'bold 24px "Plus Jakarta Sans", sans-serif';

  for (let n = 0; n < words.length; n++) {
    const testLine = currentLine + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      lines.push(currentLine.trim());
      currentLine = words[n] + ' ';
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine.trim());

  // Show max 2 lines
  const displayLines = lines.slice(0, 2);
  const totalTextHeight = displayLines.length * lineHeight;
  const startY = y - totalTextHeight;

  // Measure max width for background pill
  let maxLineWidth = 0;
  for (const line of displayLines) {
    const w = ctx.measureText(line).width;
    if (w > maxLineWidth) maxLineWidth = w;
  }

  // Draw translucent dark background pill
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x - maxLineWidth / 2 - 20, startY - 10, maxLineWidth + 40, totalTextHeight + 18, 10);
  } else {
    ctx.rect(x - maxLineWidth / 2 - 20, startY - 10, maxLineWidth + 40, totalTextHeight + 18);
  }
  ctx.fill();

  // Draw border outline & fill text
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#000000';
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  for (let i = 0; i < displayLines.length; i++) {
    const lineY = startY + i * lineHeight;
    ctx.strokeText(displayLines[i], x, lineY);
    ctx.fillText(displayLines[i], x, lineY);
  }
  ctx.restore();
}

async function composeAndRenderVideo(scenes) {
  const canvas = document.getElementById('dramaCanvas');
  const videoOverlay = document.getElementById('videoOverlayEmpty');
  const videoPlayer = document.getElementById('renderedVideoPlayer');
  const downloadBtn = document.getElementById('btnDownloadVideo');
  if (!canvas) return;

  if (videoOverlay) videoOverlay.style.display = 'none';
  if (videoPlayer) {
    videoPlayer.style.display = 'none';
    videoPlayer.pause();
  }
  canvas.style.display = 'block';

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Pre-load SVG/Image assets
  const scenesToRender = scenes.slice(0, Math.min(scenes.length, 12));
  const loadedImages = [];

  for (const s of scenesToRender) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = s.imageUrl || `/api/drama/image?scene=${s.clipNumber}&title=${encodeURIComponent(s.sceneName || '')}`;
    
    // Non-blocking load with fast timeout
    await new Promise(r => {
      let done = false;
      img.onload = () => { if (!done) { done = true; r(); } };
      img.onerror = () => { if (!done) { done = true; r(); } };
      setTimeout(() => { if (!done) { done = true; r(); } }, 600);
    });
    loadedImages.push({ img, scene: s });
  }

  // Setup MediaRecorder
  let recordedChunks = [];
  let stream = canvas.captureStream(30);
  let mediaRecorder = null;
  try {
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
  } catch {
    try {
      mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    } catch {
      console.warn('MediaRecorder not supported');
    }
  }

  if (mediaRecorder) {
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.push(e.data);
    };
    mediaRecorder.onstop = () => {
      currentRecordedVideoBlob = new Blob(recordedChunks, { type: 'video/webm' });
      if (videoPlayer) {
        videoPlayer.src = URL.createObjectURL(currentRecordedVideoBlob);
        videoPlayer.style.display = 'block';
        videoPlayer.controls = true;
        canvas.style.display = 'none';
      }
      if (downloadBtn) downloadBtn.disabled = false;
    };
    mediaRecorder.start();
  }

  // Animation timeline
  const durationPerSceneMs = 3500; // 3.5s per scene
  const totalScenes = loadedImages.length;
  const totalDurationMs = totalScenes * durationPerSceneMs;
  let startTime = performance.now();
  let lastSpokenSceneIdx = -1;

  // Play background dramatic drone
  playDramaticDrone(totalDurationMs / 1000);

  function drawFrame(currentTime) {
    const elapsed = currentTime - startTime;
    const sceneIdx = Math.min(totalScenes - 1, Math.floor(elapsed / durationPerSceneMs));
    const sceneProgress = (elapsed % durationPerSceneMs) / durationPerSceneMs;
    const current = loadedImages[sceneIdx];

    if (!current) return;

    // Trigger AI speech voice for current scene
    if (sceneIdx !== lastSpokenSceneIdx) {
      lastSpokenSceneIdx = sceneIdx;
      const textToSpeak = current.scene.narration + (current.scene.dialogue ? ' ' + current.scene.dialogue : '');
      speakText(textToSpeak);
    }

    // 1. Draw Background Image or Procedural Scenery
    ctx.clearRect(0, 0, width, height);

    if (current.img && current.img.complete && current.img.naturalWidth > 0) {
      // Ken Burns smooth camera motion
      const scale = 1.0 + sceneProgress * 0.08;
      const panX = Math.sin(sceneProgress * Math.PI) * 12;
      const sw = width * scale;
      const sh = height * scale;
      const sx = -(sw - width) / 2 + panX;
      const sy = -(sh - height) / 2;
      ctx.drawImage(current.img, sx, sy, sw, sh);
    } else {
      // Procedural artistic scene guaranteed!
      drawProceduralScene(ctx, width, height, current.scene.clipNumber, sceneProgress);
    }

    // 2. Cinematic Letterbox Bars
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, 40);
    ctx.fillRect(0, height - 40, width, 40);

    // 3. Top Watermark & Scene Title
    ctx.font = '600 15px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`PROMPT ${String(current.scene.clipNumber).padStart(3, '0')} | VIETNAMESE DRAMA MUSE STUDIO PRO`, 30, 20);

    ctx.font = '500 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#f59e0b';
    ctx.textAlign = 'right';
    ctx.fillText(current.scene.sceneName || '', width - 30, 20);

    // 4. Subtitle Drawing with Multi-line Wrapping & Translucent Pill
    const isNarration = sceneProgress < 0.58;
    const subText = isNarration ? current.scene.narration : (current.scene.dialogue ? `[${current.scene.dialogueOwner}]: "${current.scene.dialogue}"` : current.scene.narration);
    const subColor = isNarration ? '#fef08a' : '#ffffff';

    drawWrappedSubtitle(ctx, subText, width / 2, height - 60, width - 240, 32, subColor);

    // 5. Update Time Tracker
    const timeTrackEl = document.getElementById('videoTimeTrack');
    if (timeTrackEl) {
      const curSec = Math.floor(elapsed / 1000);
      const totalSec = Math.floor(totalDurationMs / 1000);
      timeTrackEl.textContent = `00:${String(curSec).padStart(2, '0')} / 00:${String(totalSec).padStart(2, '0')}`;
    }

    if (elapsed < totalDurationMs) {
      canvasAnimId = requestAnimationFrame(drawFrame);
    } else {
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
    }
  }

  canvasAnimId = requestAnimationFrame(drawFrame);
}

function toggleCanvasPlay() {
  const videoPlayer = document.getElementById('renderedVideoPlayer');
  const icon = document.getElementById('playIconText');
  if (videoPlayer && videoPlayer.style.display !== 'none') {
    if (videoPlayer.paused) {
      videoPlayer.play();
      if (icon) icon.textContent = '⏸️ Tạm Dừng';
    } else {
      videoPlayer.pause();
      if (icon) icon.textContent = '▶️ Phát Video';
    }
  } else if (currentDramaProduction && currentDramaProduction.scenes) {
    composeAndRenderVideo(currentDramaProduction.scenes);
  }
}

function downloadRenderedVideo() {
  if (!currentRecordedVideoBlob) return alert('Chưa có video được render!');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(currentRecordedVideoBlob);
  a.download = `${currentDramaProduction?.title || 'vietnamese_drama'}.webm`;
  a.click();
}

function downloadAllDramaAssets() {
  if (!currentDramaProduction) return alert('Chưa có dự án phim nào được sản xuất!');

  const fullData = {
    title: currentDramaProduction.title,
    metadata: currentDramaProduction.metadata,
    prompts: currentDramaProduction.prompts,
    srtSubtitles: currentDramaProduction.srtContent,
    storyMarkdown: currentDramaProduction.storyMarkdown,
    scenes: currentDramaProduction.scenes
  };

  const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${currentDramaProduction.title}_production_package.json`;
  a.click();
  alert('Đã tải trọn bộ hồ sơ sản xuất phim Drama (.json)! Bạn có thể tải thêm file .SRT và .WEBM ở các nút bên cạnh.');
}


// ==========================================
// ⚡ KAIZEN UTILITIES: MAIL.TM & KEEPALIVE
// ==========================================
let mailTmPollInterval = null;
let currentMailTmToken = null;

async function createMailTmTempMail() {
  const btn = document.getElementById('btnMailTmCreate');
  const statusBox = document.getElementById('mailTmStatusBox');
  const statusText = document.getElementById('mailTmStatusText');
  const emailDisplay = document.getElementById('mailTmEmailDisplay');
  const otpResult = document.getElementById('mailTmOtpResult');
  const inputEmail = document.getElementById('inputEmail');

  btn.disabled = true;
  statusBox.style.display = 'block';
  statusText.textContent = 'Đang khởi tạo email tạm... ⏳';
  otpResult.style.display = 'none';

  try {
    const res = await fetch('/api/auth/mailtm-otp?action=create', { method: 'POST' });
    const data = await res.json();

    if (!data.success) throw new Error(data.error || 'Lỗi tạo mail');

    currentMailTmToken = data.token;
    emailDisplay.textContent = data.email;
    if (inputEmail) inputEmail.value = data.email;

    statusText.textContent = 'Đang lắng nghe mã OTP từ Muse... ⏳';
    
    // Copy email to clipboard automatically
    navigator.clipboard.writeText(data.email);
    alert(`🎉 Đã tạo thành công Email tạm:\n\n${data.email}\n\n(Đã tự động copy vào bộ nhớ tạm & điền vào ô đăng nhập. Hãy bấm gửi mã trên muse.ai!)`);

    // Start auto polling OTP every 3 seconds for up to 5 minutes
    if (mailTmPollInterval) clearInterval(mailTmPollInterval);
    let attempts = 0;
    mailTmPollInterval = setInterval(async () => {
      attempts++;
      if (attempts > 100) {
        clearInterval(mailTmPollInterval);
        statusText.textContent = 'Hết thời gian chờ (5 phút).';
        return;
      }
      try {
        const pollRes = await fetch('/api/auth/mailtm-otp?action=poll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: currentMailTmToken })
        });
        const pollData = await pollRes.json();
        if (pollData.found && pollData.code) {
          clearInterval(mailTmPollInterval);
          statusText.textContent = 'Đã nhận được mã OTP!';
          otpResult.style.display = 'block';
          otpResult.textContent = `🔑 Mã OTP: ${pollData.code} (${pollData.subject})`;
          const inputPwd = document.getElementById('inputPassword');
          if (inputPwd) inputPwd.value = pollData.code;
          navigator.clipboard.writeText(pollData.code);
          alert(`🎉 ĐÃ NHẬN ĐƯỢC MÃ OTP TỪ MUSE:\n\n${pollData.code}\n\n(Đã tự động điền vào ô Mật khẩu/OTP!)`);
        }
      } catch (e) {
        console.warn('Poll OTP note:', e);
      }
    }, 3000);

  } catch (err) {
    alert('Lỗi tạo Mail.tm: ' + err.message);
    statusBox.style.display = 'none';
  } finally {
    btn.disabled = false;
  }
}

async function wakeCloudVmAndRenew() {
  const btn = document.getElementById('btnKeepaliveWake');
  btn.disabled = true;
  btn.textContent = '⏳ Đang đánh thức VM...';

  try {
    const res = await fetch('/api/auth/keepalive', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentApiKey}`
      }
    });

    const data = await res.json();
    if (data.success) {
      alert(`✅ THÀNH CÔNG:\n\n${data.message}\n\nCloud VM: ${data.vmState}\nVM ID: ${data.vmId}`);
    } else {
      alert('Thông báo: ' + data.message);
    }
  } catch (err) {
    alert('Lỗi keepalive: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '🛡️ <strong>Giữ Phiên 48h & Wake VM</strong><div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">Gia hạn hatch_vml & VM</div>';
  }
}
