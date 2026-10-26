// Extension Popup Controller - Cleaned, Deobfuscated & Unlocked
let currentStatusState = 'disconnected';
let currentStatusData = null;
let extractedCookieString = '';

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initMuseExtractor();
  initProxyControls();
  loadSettings();
  setInterval(updateUI, 1500);
});

// Tab Navigation
function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById(btn.dataset.tab);
      if (target) target.classList.add('active');
    });
  });
}

// ⚡ Auto-Grab Muse Cookies
function initMuseExtractor() {
  const btnGrab = document.getElementById('btnAutoGrabMuse');
  const resultBox = document.getElementById('museExtractResult');
  const inpSess = document.getElementById('exHatchSess');
  const inpGw = document.getElementById('exHatchGw');
  const btnCopy = document.getElementById('btnCopyTokens');
  const btnOpenWeb = document.getElementById('btnOpenWebDashboard');

  if (!btnGrab) return;

  btnGrab.addEventListener('click', () => {
    btnGrab.disabled = true;
    btnGrab.textContent = 'Đang quét cookie muse.ai... ⏳';

    chrome.runtime.sendMessage({ action: 'autoFetchMuseCookies' }, (response) => {
      btnGrab.disabled = false;
      btnGrab.textContent = '⚡ Auto Lấy API Muse từ trình duyệt';

      if (response && response.success) {
        extractedCookieString = response.cookieString || '';
        resultBox.style.display = 'block';

        inpSess.value = response.cookies?.hatch_sess || '(Chưa đăng nhập trên muse.ai)';
        inpGw.value = response.cookies?.hatch_gw || '(Chưa đăng nhập trên muse.ai)';

        if (!response.cookies?.hatch_sess) {
          showToast('⚠️ Bạn chưa đăng nhập trên https://muse.ai');
        } else {
          showToast('✅ Đã bắt thành công Token Muse!');
        }
      } else {
        showToast('Lỗi: ' + (response?.error || 'Không đọc được cookie'));
      }
    });
  });

  if (btnCopy) {
    btnCopy.addEventListener('click', () => {
      if (!extractedCookieString) {
        showToast('Chưa có cookie để copy!');
        return;
      }
      navigator.clipboard.writeText(extractedCookieString).then(() => {
        showToast('Đã copy chuỗi Cookie! ⚡');
      });
    });
  }

  if (btnOpenWeb) {
    btnOpenWeb.addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://api-muse-2026.vercel.app' });
    });
  }
}

// Proxy Management
function initProxyControls() {
  const toggleProxy = document.getElementById('toggleProxy');
  const blockDirect = document.getElementById('blockDirect');
  const btnSave = document.getElementById('btnSave');
  const proxyHostInput = document.getElementById('proxyHost');

  if (proxyHostInput) {
    proxyHostInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      const parts = val.split(':');
      if (parts.length === 4) {
        document.getElementById('proxyHost').value = parts[0];
        document.getElementById('proxyPort').value = parts[1];
        document.getElementById('proxyUsername').value = parts[2];
        document.getElementById('proxyPassword').value = parts[3];
        showToast('Đã tự động điền cấu hình Proxy! ⚡');
      } else if (parts.length === 2 && /^\d+$/.test(parts[1])) {
        document.getElementById('proxyHost').value = parts[0];
        document.getElementById('proxyPort').value = parts[1];
      }
    });
  }

  if (btnSave) {
    btnSave.addEventListener('click', () => {
      const config = getConfigFromForm();
      chrome.runtime.sendMessage({ action: 'saveConfigOnly', config }, (res) => {
        if (res && res.success) {
          btnSave.textContent = 'Đã lưu! ✅';
          btnSave.style.backgroundColor = '#10B981';
          setTimeout(() => {
            btnSave.textContent = 'Lưu cấu hình';
            btnSave.style.backgroundColor = '';
          }, 1500);
        }
      });
    });
  }

  if (toggleProxy) {
    toggleProxy.addEventListener('change', () => {
      if (toggleProxy.checked) {
        const config = getConfigFromForm();
        if (!config.host || !config.port) {
          alert('Thiếu thông tin Host / Port!');
          toggleProxy.checked = false;
          return;
        }
        updateStatusVisual('checking');
        chrome.runtime.sendMessage({ action: 'setProxy', config });
      } else {
        const shouldBlock = blockDirect?.checked || false;
        updateStatusVisual(shouldBlock ? 'blocked' : 'disconnected');
        chrome.runtime.sendMessage({ action: 'disableProxy', blockDirect: shouldBlock });
      }
    });
  }

  if (blockDirect) {
    blockDirect.addEventListener('change', () => {
      if (!toggleProxy?.checked) {
        const shouldBlock = blockDirect.checked;
        updateStatusVisual(shouldBlock ? 'blocked' : 'disconnected');
        chrome.runtime.sendMessage({ action: 'disableProxy', blockDirect: shouldBlock });
      }
    });
  }
}

function getConfigFromForm() {
  return {
    type: document.getElementById('proxyType')?.value || 'socks5',
    host: document.getElementById('proxyHost')?.value.trim() || '',
    port: document.getElementById('proxyPort')?.value.trim() || '8080',
    username: document.getElementById('proxyUsername')?.value.trim() || '',
    password: document.getElementById('proxyPassword')?.value.trim() || ''
  };
}

function loadSettings() {
  chrome.runtime.sendMessage({ action: 'getProxyStatus' }, (status) => {
    if (!status) return;
    if (document.getElementById('proxyType')) document.getElementById('proxyType').value = status.type || 'socks5';
    if (document.getElementById('proxyHost')) document.getElementById('proxyHost').value = status.host || '';
    if (document.getElementById('proxyPort')) document.getElementById('proxyPort').value = status.port || '8080';
    if (document.getElementById('proxyUsername')) document.getElementById('proxyUsername').value = status.username || '';
    if (document.getElementById('proxyPassword')) document.getElementById('proxyPassword').value = status.password || '';

    const toggle = document.getElementById('toggleProxy');
    const block = document.getElementById('blockDirect');
    if (toggle) toggle.checked = status.enabled;
    if (block) block.checked = status.blockDirect;

    if (status.enabled) {
      updateStatusVisual(status.isOnline ? 'connected' : 'error', status);
    } else {
      updateStatusVisual(status.blockDirect ? 'blocked' : 'disconnected');
    }
  });
}

function updateUI() {
  const toggle = document.getElementById('toggleProxy');
  if (!toggle || !toggle.checked) return;
  chrome.runtime.sendMessage({ action: 'getProxyStatus' }, (status) => {
    if (!status) return;
    updateStatusVisual(status.isOnline ? 'connected' : 'error', status);
  });
}

function updateStatusVisual(state, data = null) {
  currentStatusState = state || 'disconnected';
  const statusBox = document.getElementById('statusBox');
  const statusTitle = document.getElementById('statusTitle');
  const statusDesc = document.getElementById('statusDesc');

  if (!statusBox || !statusTitle || !statusDesc) return;

  statusBox.className = 'status-box';
  if (currentStatusState === 'connected') {
    statusBox.classList.add('connected');
    statusTitle.textContent = 'KẾT NỐI THÀNH CÔNG';
    statusDesc.textContent = data ? `Proxy: ${data.host}:${data.port}` : '';
  } else if (currentStatusState === 'error') {
    statusBox.classList.add('error');
    statusTitle.textContent = 'MẤT KẾT NỐI';
    statusDesc.textContent = 'Đang kiểm tra kết nối...';
  } else if (currentStatusState === 'blocked') {
    statusBox.classList.add('blocked');
    statusTitle.textContent = 'KILL SWITCH: ON';
    statusDesc.textContent = 'Đang chặn toàn bộ mạng gốc';
  } else if (currentStatusState === 'checking') {
    statusTitle.textContent = 'ĐANG KẾT NỐI...';
    statusDesc.textContent = 'Vui lòng đợi giây lát';
  } else {
    statusBox.classList.add('disconnected');
    statusTitle.textContent = 'Đã tắt Proxy';
    statusDesc.textContent = 'Đang dùng mạng gốc';
  }
}

function showToast(msg) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    background: #1e293b;
    color: #f8fafc;
    border: 1px solid rgba(255,255,255,0.2);
    padding: 8px 14px;
    border-radius: 6px;
    font-size: 12px;
    z-index: 9999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  `;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}
