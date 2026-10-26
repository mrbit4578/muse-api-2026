// Unified Server & Vercel Serverless Entrypoint for API Muse 2026
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Static explicit requires so Vercel NFT (Node File Trace) bundles all routes
const API_ROUTES = {
  '/api': require('./api/index'),
  '/api/': require('./api/index'),
  '/api/auth/login': require('./api/auth/login'),
  '/api/auth/extract-session': require('./api/auth/extract-session'),
  '/api/auth/status': require('./api/auth/status'),
  '/api/auth/keepalive': require('./api/auth/keepalive'),
  '/api/auth/mailtm-otp': require('./api/auth/mailtm-otp'),
  '/api/drama/generate': require('./api/drama/generate'),
  '/api/drama/image': require('./api/drama/image'),
  '/api/accounts': require('./api/accounts'),
  '/api/proxy-check': require('./api/proxy-check'),
  '/v1/chat/completions': require('./api/v1/chat/completions'),
  '/v1/images/generations': require('./api/v1/images/generations'),
  '/v1/models': require('./api/v1/models'),
  '/v1/videos': require('./api/v1/videos')
};

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-muse-token, x-account-id');
}

// In-memory static file cache for high-speed delivery
const staticCache = new Map();
function getStaticFile(filePath) {
  if (staticCache.has(filePath)) return staticCache.get(filePath);
  try {
    if (fs.existsSync(filePath)) {
      const buf = fs.readFileSync(filePath);
      staticCache.set(filePath, buf);
      return buf;
    }
  } catch (e) {
    console.warn('Read file error:', e.message);
  }
  return null;
}

// Main Universal Request Handler (Vercel Serverless Function & Standalone HTTP)
async function requestHandler(req, res) {
  try {
    setCors(res);

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      return res.end();
    }

    const parsedUrl = url.parse(req.url || '/', true);
    const pathname = parsedUrl.pathname || '/';

    // Safely assign query without throwing getter TypeError on Vercel
    try {
      if (!req.query) {
        req.query = parsedUrl.query || {};
      }
    } catch {}

    // Parse body if POST/PUT and not already parsed
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && !req.body) {
      try {
        const buffers = [];
        for await (const chunk of req) {
          buffers.push(chunk);
        }
        const rawBody = Buffer.concat(buffers).toString();
        try {
          req.body = rawBody ? JSON.parse(rawBody) : {};
        } catch {
          req.body = rawBody;
        }
      } catch {}
    }

    // Helper response methods for Vercel / Express compatibility
    if (!res.status) {
      res.status = function(code) {
        this.statusCode = code;
        return this;
      };
    }
    if (!res.json) {
      res.json = function(data) {
        this.setHeader('Content-Type', 'application/json');
        this.end(JSON.stringify(data));
      };
    }
    if (!res.send) {
      res.send = function(data) {
        this.end(data);
      };
    }

    // 1. Direct API Route Matching
    if (API_ROUTES[pathname]) {
      return await API_ROUTES[pathname](req, res);
    }
    if (pathname.startsWith('/v1/videos/')) {
      return await API_ROUTES['/v1/videos'](req, res);
    }

    // 2. Serve static files from public/ or dist/
    const cleanPath = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
    let fileBuf = getStaticFile(path.join(__dirname, 'public', cleanPath)) ||
                  getStaticFile(path.join(__dirname, 'dist', cleanPath));

    if (fileBuf) {
      const ext = path.extname(cleanPath).toLowerCase();
      res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
      return res.end(fileBuf);
    }

    // 3. Fallback to index.html for SPA client-side routing
    const indexBuf = getStaticFile(path.join(__dirname, 'public', 'index.html')) ||
                     getStaticFile(path.join(__dirname, 'dist', 'index.html'));

    if (indexBuf) {
      res.setHeader('Content-Type', 'text/html; charset=UTF-8');
      return res.end(indexBuf);
    }

    res.statusCode = 404;
    res.end('Not Found');
  } catch (err) {
    console.error('[Serverless Request Handler Error]', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: {
        message: err.message,
        type: 'internal_server_error'
      }
    }));
  }
}

// Standalone server for local development and Vercel Bridge
// Standalone server for local development
const server = http.createServer(requestHandler);

// Only listen when running locally, not inside Vercel Serverless environment
if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`\n🚀 API Muse 2026 Server running at http://localhost:${PORT}`);
    console.log(`🌐 Web App Dashboard: http://localhost:${PORT}`);
    console.log(`📡 OpenAI Base URL:    http://localhost:${PORT}/v1\n`);
  });
}

// Export callable requestHandler for Vercel @vercel/node runtime
module.exports = requestHandler;
