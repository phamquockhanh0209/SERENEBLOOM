import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chatHandler from './api/chat.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

// Đọc file .env nếu có (không cần cài thư viện dotenv)
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      process.env[key] = val;
    }
  }
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  let pathname = url.pathname;

  // Xử lý API route /api/chat
  if (pathname === '/api/chat') {
    let bodyData = '';
    req.on('data', chunk => {
      bodyData += chunk;
    });

    req.on('end', async () => {
      try {
        req.body = bodyData ? JSON.parse(bodyData) : {};
      } catch {
        req.body = {};
      }

      // Mô phỏng hàm res.status().json() tương thích với Vercel Serverless Function
      const vercelRes = {
        statusCode: 200,
        setHeader(name, value) {
          res.setHeader(name, value);
        },
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(data) {
          res.writeHead(this.statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify(data));
        }
      };

      try {
        await chatHandler(req, vercelRes);
      } catch (err) {
        console.error('Serverless error:', err);
        vercelRes.status(500).json({ error: 'Lỗi server nội bộ' });
      }
    });
    return;
  }

  // Xử lý Static Files
  if (pathname === '/') {
    pathname = '/index.html';
  } else if (!path.extname(pathname)) {
    // Nếu truy cập /chat -> thử mở /chat.html
    const tryHtml = path.join(__dirname, pathname + '.html');
    if (fs.existsSync(tryHtml)) {
      pathname = pathname + '.html';
    }
  }

  const filePath = path.join(__dirname, pathname);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        const notFoundPath = path.join(__dirname, '404.html');
        if (fs.existsSync(notFoundPath)) {
          res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(fs.readFileSync(notFoundPath));
        } else {
          res.writeHead(404);
          res.end('404 Not Found');
        }
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n==========================================`);
  console.log(`🌿 SereneBloom Server đang chạy tại:`);
  console.log(`👉 http://localhost:${PORT}`);
  console.log(`👉 http://localhost:${PORT}/chat.html`);
  console.log(`==========================================\n`);
});
