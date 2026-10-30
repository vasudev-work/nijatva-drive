#!/usr/bin/env node
/**
 * Nijatva Drive — API stub.
 *
 * Zero dependencies: run with `node server/index.js` (Node 18+).
 * In-memory only. Swap the store for Postgres/S3 when you wire the real backend.
 */
const http = require('node:http');

const PORT = Number(process.env.PORT || 8787);
const VERSION = '0.1.0';

const files = new Map();
let seq = 1;

function seed() {
  const now = Date.now();
  files.set('seed_root_docs', {
    id: 'seed_root_docs',
    name: 'Documents',
    kind: 'folder',
    size: 0,
    updatedAt: now - 1000 * 60 * 60 * 30,
    owner: 'demo@nijatva.app',
  });
  files.set('seed_readme', {
    id: 'seed_readme',
    name: 'Welcome.md',
    kind: 'file',
    size: 214,
    updatedAt: now - 1000 * 60 * 90,
    owner: 'demo@nijatva.app',
  });
}
seed();

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 5 * 1024 * 1024) {
        reject(new Error('Payload too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  const path = url.pathname.replace(/\/+$/, '') || '/';

  if (req.method === 'OPTIONS') {
    json(res, 204, {});
    return;
  }

  if (path === '/health') {
    json(res, 200, { status: 'ok', service: 'nijatva-drive-api', version: VERSION });
    return;
  }

  if (path === '/api/auth/login' && req.method === 'POST') {
    const body = await readBody(req).catch(() => ({}));
    json(res, 200, {
      token: 'stub-token',
      user: { id: 'demo', email: body.email || 'demo@nijatva.app', name: 'Demo User' },
      quotaBytes: 15 * 1024 * 1024 * 1024,
    });
    return;
  }

  if (path === '/api/files' && req.method === 'GET') {
    json(res, 200, { files: [...files.values()] });
    return;
  }

  if (path === '/api/files' && req.method === 'POST') {
    const body = await readBody(req).catch(() => ({}));
    if (!body.name) {
      json(res, 400, { error: 'name is required' });
      return;
    }
    const id = `f_${seq++}`;
    const record = {
      id,
      name: String(body.name),
      kind: body.kind === 'folder' ? 'folder' : 'file',
      size: Number(body.size || 0),
      updatedAt: Date.now(),
      owner: 'demo@nijatva.app',
    };
    files.set(id, record);
    json(res, 201, record);
    return;
  }

  if (path === '/api/files/sync' && req.method === 'POST') {
    const body = await readBody(req).catch(() => ({}));
    const incoming = Array.isArray(body.files) ? body.files : [];
    for (const item of incoming) {
      if (!item || !item.id) continue;
      files.set(item.id, {
        id: item.id,
        name: String(item.name || 'untitled'),
        kind: item.kind === 'folder' ? 'folder' : 'file',
        size: Number(item.size || 0),
        updatedAt: Number(item.updatedAt || Date.now()),
        owner: 'demo@nijatva.app',
      });
    }
    json(res, 200, { accepted: incoming.length, total: files.size });
    return;
  }

  const match = path.match(/^\/api\/files\/([\w.-]+)$/);
  if (match) {
    const id = match[1];
    if (req.method === 'PATCH') {
      const existing = files.get(id);
      if (!existing) {
        json(res, 404, { error: 'not found' });
        return;
      }
      const body = await readBody(req).catch(() => ({}));
      const updated = { ...existing, ...body, id, updatedAt: Date.now() };
      files.set(id, updated);
      json(res, 200, updated);
      return;
    }
    if (req.method === 'DELETE') {
      const existed = files.delete(id);
      json(res, existed ? 200 : 404, existed ? { deleted: id } : { error: 'not found' });
      return;
    }
    if (req.method === 'GET') {
      const record = files.get(id);
      json(res, record ? 200 : 404, record || { error: 'not found' });
      return;
    }
  }

  json(res, 404, { error: 'Unknown route', path });
});

server.listen(PORT, () => {
  console.log(`Nijatva Drive API stub listening on http://localhost:${PORT}`);
});
