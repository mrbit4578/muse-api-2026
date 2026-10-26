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

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-muse-token, x-account-id');
}

async function handleApiRoute(req, res, handlerPath) {
  try {
    delete require.cache[require.resolve(handlerPath)];
    const handler = require(handlerPath);
    return await handler(req, res);
  } catch (err) {
    console.error('API Error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: { message: err.message, type: 'internal_server_error' } }));
  }
}

// Main Universal Request Handler (Works for both Standalone HTTP & Vercel Serverless Function)
async function requestHandler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url || '/', true);
  const pathname = parsedUrl.pathname || '/';

  // Add query to req for Vercel compatibility
  req.query = req.query || parsedUrl.query || {};

  // Parse body if POST/PUT and not already parsed
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && !req.body) {
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
  }

  // Helper response methods for Vercel compatibility
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

  // 1. API Route mapping
  if (pathname === '/api' || pathname === '/api/') {
    return handleApiRoute(req, res, './api/index');
  }
  if (pathname === '/v1/chat/completions') {
    return handleApiRoute(req, res, './api/v1/chat/completions');
  }
  if (pathname === '/v1/images/generations') {
    return handleApiRoute(req, res, './api/v1/images/generations');
  }
  if (pathname === '/v1/models') {
    return handleApiRoute(req, res, './api/v1/models');
  }
  if (pathname === '/v1/videos' || pathname.startsWith('/v1/videos/')) {
    return handleApiRoute(req, res, './api/v1/videos');
  }
  if (pathname === '/api/auth/login') {
    return handleApiRoute(req, res, './api/auth/login');
  }
  if (pathname === '/api/auth/extract-session') {
    return handleApiRoute(req, res, './api/auth/extract-session');
  }
  if (pathname === '/api/auth/status') {
    return handleApiRoute(req, res, './api/auth/status');
  }
  if (pathname === '/api/auth/keepalive') {
    return handleApiRoute(req, res, './api/auth/keepalive');
  }
  if (pathname === '/api/auth/mailtm-otp') {
    return handleApiRoute(req, res, './api/auth/mailtm-otp');
  }
  if (pathname === '/api/drama/generate') {
    return handleApiRoute(req, res, './api/drama/generate');
  }
  if (pathname === '/api/drama/image') {
    return handleApiRoute(req, res, './api/drama/image');
  }
  if (pathname === '/api/accounts') {
    return handleApiRoute(req, res, './api/accounts');
  }
  if (pathname === '/api/proxy-check') {
    return handleApiRoute(req, res, './api/proxy-check');
  }

  // 2. Serve static files from public/ or dist/
  const cleanPath = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
  let filePath = path.join(__dirname, 'public', cleanPath);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, 'dist', cleanPath);
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
    const fileContent = fs.readFileSync(filePath);
    return res.end(fileContent);
  }

  // 3. Fallback to index.html for SPA client-side routing
  const fallbackIndex = fs.existsSync(path.join(__dirname, 'public', 'index.html'))
    ? path.join(__dirname, 'public', 'index.html')
    : path.join(__dirname, 'dist', 'index.html');

  if (fs.existsSync(fallbackIndex)) {
    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    const htmlContent = fs.readFileSync(fallbackIndex);
    return res.end(htmlContent);
  }

  res.statusCode = 404;
  res.end('Not Found');
}

// Standalone server for local development (node server.js / npm start)
const server = http.createServer(requestHandler);

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`\n🚀 API Muse 2026 Server running at http://localhost:${PORT}`);
    console.log(`🌐 Web App Dashboard: http://localhost:${PORT}`);
    console.log(`📡 OpenAI Base URL:    http://localhost:${PORT}/v1\n`);
  });
}

// Export callable requestHandler for Vercel Serverless Function entrypoint
module.exports = requestHandler;
