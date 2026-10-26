// API Handler: High-Performance Cinematic Scene Visual Generator & Image Proxy
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, max-age=86400, immutable');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  const { scene = '1', title = '', mood = 'dark' } = req.query || {};
  const sceneNum = parseInt(scene, 10) || 1;

  // Generate high-resolution cinematic SVG visuals (1280x720) with dramatic lighting
  const svgContent = generateCinematicSceneSVG(sceneNum, title, mood);

  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  if (typeof res.send === 'function') {
    res.statusCode = 200;
    return res.send(svgContent);
  }
  if (typeof res.status === 'function') {
    try {
      const s = res.status(200);
      if (s && typeof s.send === 'function') return s.send(svgContent);
    } catch {}
  }
  res.statusCode = 200;
  return res.end(svgContent);
};

function generateCinematicSceneSVG(sceneNum, title, mood) {
  const seed = (sceneNum % 6) + 1;

  let gradientDef = '';
  let sceneryElements = '';
  let lightingDef = '';

  switch (seed) {
    case 1:
      // Luxury Banquet Hall (Đại sảnh tiệc mừng thọ xa hoa)
      gradientDef = `
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1c1106" />
          <stop offset="40%" stop-color="#2a1b0c" />
          <stop offset="100%" stop-color="#0a0703" />
        </linearGradient>
        <radialGradient id="chandelierGlow" cx="50%" cy="15%" r="60%">
          <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.45" />
          <stop offset="50%" stop-color="#d97706" stop-opacity="0.15" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0" />
        </radialGradient>
      `;
      sceneryElements = `
        <!-- Chandelier & Golden Lights -->
        <rect x="0" y="0" width="1280" height="720" fill="url(#chandelierGlow)" />
        <path d="M600,0 L640,0 L660,110 L620,110 Z" fill="#d97706" opacity="0.6" />
        <circle cx="640" cy="115" r="18" fill="#fef08a" opacity="0.9" />
        <line x1="560" y1="120" x2="720" y2="120" stroke="#f59e0b" stroke-width="4" opacity="0.8" />
        <!-- Banquet Table Silhouette -->
        <ellipse cx="640" cy="620" rx="600" ry="160" fill="#17120a" stroke="#452a12" stroke-width="3" />
        <!-- Wine Glasses & Decanters -->
        <path d="M480,510 L490,470 L510,470 L520,510 Z" fill="#fef08a" opacity="0.4" />
        <path d="M780,510 L790,465 L810,465 L820,510 Z" fill="#ef4444" opacity="0.4" />
        <!-- Pillars -->
        <rect x="80" y="0" width="90" height="720" fill="#1e1710" opacity="0.7" />
        <rect x="1110" y="0" width="90" height="720" fill="#1e1710" opacity="0.7" />
      `;
      break;

    case 2:
      // Shattered Glass & Conflict (Mảnh vỡ ly rượu, tranh cãi gay gắt)
      gradientDef = `
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#0a0e17" />
          <stop offset="60%" stop-color="#1e1b2e" />
          <stop offset="100%" stop-color="#05070a" />
        </linearGradient>
        <radialGradient id="spotLight" cx="50%" cy="80%" r="40%">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.25" />
          <stop offset="100%" stop-color="#000" stop-opacity="0" />
        </radialGradient>
      `;
      sceneryElements = `
        <!-- Spotlight on ground -->
        <ellipse cx="640" cy="580" rx="360" ry="90" fill="url(#spotLight)" />
        <!-- Marble Floor Perspective Grid -->
        <line x1="100" y1="720" x2="540" y2="450" stroke="#334155" stroke-width="1.5" opacity="0.4" />
        <line x1="1180" y1="720" x2="740" y2="450" stroke="#334155" stroke-width="1.5" opacity="0.4" />
        <line x1="640" y1="720" x2="640" y2="450" stroke="#334155" stroke-width="1.5" opacity="0.4" />
        <!-- Shattered Glass Shards -->
        <polygon points="620,560 645,540 655,570" fill="#93c5fd" opacity="0.8" />
        <polygon points="660,565 690,550 680,580" fill="#60a5fa" opacity="0.75" />
        <polygon points="590,575 620,565 610,595" fill="#bae6fd" opacity="0.85" />
        <polygon points="630,585 648,575 640,605" fill="#e0f2fe" opacity="0.9" />
        <!-- Red spilled liquid puddle -->
        <ellipse cx="640" cy="580" rx="80" ry="25" fill="#7f1d1d" opacity="0.6" />
      `;
      break;

    case 3:
      // Rainy City Balcony / Secret Phone Call (Ban công mưa đêm & Cuộc gọi mật)
      gradientDef = `
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#030712" />
          <stop offset="60%" stop-color="#0b1329" />
          <stop offset="100%" stop-color="#02040a" />
        </linearGradient>
      `;
      sceneryElements = `
        <!-- Distant City Neon Skyscrapers -->
        <rect x="250" y="240" width="80" height="400" fill="#0f172a" opacity="0.8" />
        <rect x="350" y="180" width="110" height="460" fill="#1e293b" opacity="0.85" />
        <rect x="750" y="210" width="90" height="430" fill="#1e293b" opacity="0.85" />
        <rect x="860" y="260" width="120" height="380" fill="#0f172a" opacity="0.8" />
        <!-- Neon Window Lights -->
        <circle cx="380" cy="220" r="3" fill="#f59e0b" opacity="0.8" />
        <circle cx="410" cy="250" r="3" fill="#00d2ff" opacity="0.8" />
        <circle cx="780" cy="240" r="3" fill="#ec4899" opacity="0.8" />
        <circle cx="810" cy="290" r="3" fill="#10b981" opacity="0.8" />
        <!-- Rain Streaks -->
        <line x1="200" y1="0" x2="160" y2="720" stroke="#38bdf8" stroke-width="1.2" opacity="0.18" />
        <line x1="450" y1="0" x2="410" y2="720" stroke="#38bdf8" stroke-width="1.2" opacity="0.22" />
        <line x1="720" y1="0" x2="680" y2="720" stroke="#38bdf8" stroke-width="1.2" opacity="0.20" />
        <line x1="1020" y1="0" x2="980" y2="720" stroke="#38bdf8" stroke-width="1.2" opacity="0.25" />
        <!-- Man Silhouette with Smartphone Glowing -->
        <path d="M600,720 L600,480 Q640,430 680,480 L680,720 Z" fill="#020617" />
        <circle cx="640" cy="430" r="32" fill="#020617" />
        <!-- Glowing Smartphone Screen -->
        <rect x="670" y="445" width="16" height="28" rx="2" fill="#38bdf8" opacity="0.95" />
      `;
      break;

    case 4:
      // Contract & Billion Dollar Inheritance Seal (Hồ sơ thừa kế nghìn tỷ)
      gradientDef = `
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#140f07" />
          <stop offset="60%" stop-color="#24180a" />
          <stop offset="100%" stop-color="#0a0703" />
        </linearGradient>
        <radialGradient id="deskLamp" cx="50%" cy="30%" r="50%">
          <stop offset="0%" stop-color="#fef08a" stop-opacity="0.35" />
          <stop offset="60%" stop-color="#ca8a04" stop-opacity="0.1" />
          <stop offset="100%" stop-color="#000" stop-opacity="0" />
        </radialGradient>
      `;
      sceneryElements = `
        <!-- Desk Lamp Warm Atmosphere -->
        <rect x="0" y="0" width="1280" height="720" fill="url(#deskLamp)" />
        <!-- Wooden Executive Desk -->
        <rect x="200" y="380" width="880" height="340" rx="8" fill="#1c1208" stroke="#3d2612" stroke-width="4" />
        <!-- Leather Folder Open -->
        <polygon points="340,440 620,410 630,640 330,670" fill="#111827" stroke="#374151" stroke-width="2" />
        <polygon points="630,410 930,440 940,670 630,640" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2" />
        <!-- Text Lines Simulation on Contract -->
        <line x1="660" y1="460" x2="880" y2="460" stroke="#94a3b8" stroke-width="3" />
        <line x1="660" y1="480" x2="860" y2="480" stroke="#94a3b8" stroke-width="2" />
        <line x1="660" y1="500" x2="900" y2="500" stroke="#94a3b8" stroke-width="2" />
        <line x1="660" y1="520" x2="820" y2="520" stroke="#94a3b8" stroke-width="2" />
        <!-- Red Official Legal Seal Stamp -->
        <circle cx="820" cy="570" r="28" fill="#ef4444" opacity="0.85" />
        <circle cx="820" cy="570" r="23" stroke="#fff" stroke-width="2" fill="none" opacity="0.8" />
        <text x="820" y="575" fill="#fff" font-size="10" font-weight="bold" text-anchor="middle" font-family="sans-serif">MUSE AI</text>
      `;
      break;

    case 5:
      // Sunrise over City / Climax of Victory (Chủ tịch trở về trong ánh bình minh)
      gradientDef = `
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#451a03" />
          <stop offset="45%" stop-color="#b45309" />
          <stop offset="70%" stop-color="#f59e0b" />
          <stop offset="100%" stop-color="#1e1b4b" />
        </linearGradient>
      `;
      sceneryElements = `
        <!-- Giant Rising Sun -->
        <circle cx="640" cy="400" r="140" fill="#fef08a" opacity="0.85" />
        <!-- Floor to Ceiling Glass Windows Architecture -->
        <line x1="200" y1="0" x2="200" y2="720" stroke="#1e293b" stroke-width="12" />
        <line x1="640" y1="0" x2="640" y2="720" stroke="#1e293b" stroke-width="14" />
        <line x1="1080" y1="0" x2="1080" y2="720" stroke="#1e293b" stroke-width="12" />
        <!-- Silhouette of Confident Man Walking into Light -->
        <path d="M605,720 L615,480 Q640,430 665,480 L675,720 Z" fill="#090d16" />
        <circle cx="640" cy="430" r="26" fill="#090d16" />
      `;
      break;

    default:
      // Traditional Vietnamese Old Apartment Living Room (Phòng khách chung cư cũ Hà Nội)
      gradientDef = `
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#18120c" />
          <stop offset="60%" stop-color="#261b11" />
          <stop offset="100%" stop-color="#0d0804" />
        </linearGradient>
        <radialGradient id="lampGlow" cx="40%" cy="30%" r="50%">
          <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.3" />
          <stop offset="100%" stop-color="#000" stop-opacity="0" />
        </radialGradient>
      `;
      sceneryElements = `
        <rect x="0" y="0" width="1280" height="720" fill="url(#lampGlow)" />
        <!-- Window with Rain Outside -->
        <rect x="750" y="100" width="380" height="340" fill="#0f172a" stroke="#334155" stroke-width="8" />
        <line x1="940" y1="100" x2="940" y2="440" stroke="#334155" stroke-width="6" />
        <line x1="750" y1="270" x2="1130" y2="270" stroke="#334155" stroke-width="6" />
        <!-- Rain outside window -->
        <line x1="820" y1="120" x2="790" y2="420" stroke="#38bdf8" stroke-width="1" opacity="0.3" />
        <line x1="980" y1="120" x2="950" y2="420" stroke="#38bdf8" stroke-width="1" opacity="0.3" />
        <!-- Modest Wooden Table in foreground -->
        <ellipse cx="450" cy="580" rx="300" ry="110" fill="#1c1208" stroke="#3a220e" stroke-width="3" />
      `;
      break;
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
      <defs>
        ${gradientDef}
      </defs>
      <!-- Base Background -->
      <rect width="1280" height="720" fill="url(#bgGrad)" />
      <!-- Scenery Layer -->
      ${sceneryElements}
      <!-- Cinematic Top & Bottom Bars (Letterbox) -->
      <rect x="0" y="0" width="1280" height="42" fill="#000000" opacity="0.85" />
      <rect x="0" y="678" width="1280" height="42" fill="#000000" opacity="0.85" />
      <!-- Scene Watermark Header -->
      <text x="30" y="27" fill="#ffffff" opacity="0.8" font-family="'JetBrains Mono', monospace" font-size="14" font-weight="600">VIETNAMESE DRAMA MUSE PRO | SCENE ${sceneNum}</text>
      <text x="1250" y="27" fill="#f59e0b" opacity="0.9" font-family="'Plus Jakarta Sans', sans-serif" font-size="13" font-weight="500" text-anchor="end">${escapeXml(title || 'Phân cảnh ' + sceneNum)}</text>
    </svg>
  `.trim();
}

function escapeXml(unsafe) {
  return String(unsafe).replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}
