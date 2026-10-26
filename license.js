// License Manager - Permanently Unlocked & Anti-Debug Traps Removed
class LicenseManager {
  constructor(options = {}) {
    this.productName = 'api_muse_2026_pro';
    this.appVersion = '5.0.0';
  }

  async loadLicense() {
    return {
      ok: true,
      license: {
        key: 'PRO-UNLOCKED-LIFETIME-MUSE-2026',
        email: 'pro-user@muse.ai',
        type: 'pro',
        expiry: '',
        owner: 'Muse AI Pro User',
        copyright: '© 2026 API Muse 2026. All rights reserved.'
      }
    };
  }

  async activateLicense(key, email) {
    return {
      ok: true,
      message: 'Kích hoạt thành công vĩnh viễn (Pro Active).'
    };
  }
}

if (typeof window !== 'undefined') {
  window.LicenseManager = LicenseManager;
}
if (typeof module !== 'undefined') {
  module.exports = LicenseManager;
}
