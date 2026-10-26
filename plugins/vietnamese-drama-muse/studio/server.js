// Web Studio Server for Vietnamese Drama Muse
const http = require('http');
const fs = require('fs');
const path = require('path');
const MuseApiBridge = require('../scripts/muse_api_bridge');

const PORT = process.env.PORT || 3001;
const bridge = new MuseApiBridge();

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  if (req.url === '/api/generate' && req.method === 'POST') {
    let body = '';
    for await (const chunk of req) body += chunk;
    const params = body ? JSON.parse(body) : {};

    try {
      const prod = await bridge.generateDramaProduction(params);
      bridge.exportToDirectory(prod, path.resolve(__dirname, '..', 'export'));
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.end(JSON.stringify(prod));
    } catch (err) {
      res.statusCode = 500;
      return res.end(JSON.stringify({ error: err.message }));
    }
  }

  // Serve studio/index.html
  const indexPath = path.join(__dirname, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return fs.createReadStream(indexPath).pipe(res);
  }

  res.statusCode = 404;
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`\n🎬 Vietnamese Drama Muse Studio running at: http://localhost:${PORT}\n`);
});
