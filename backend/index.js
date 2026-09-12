import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(serverDirectory, '../.env') });
const app = express();
const baseUrl = process.env.IVY_API_BASE_URL || 'https://solve.ivy.homes';
const apiKey = process.env.IVY_API_KEY;
app.use(cors());
app.use(express.json());

function apiHeaders(req, extra = {}) {
  const headers = { 'X-API-Key': apiKey, ...extra };
  if (req.headers.authorization) headers.Authorization = req.headers.authorization;
  return headers;
}
async function forward(req, res, target, options = {}) {
  if (!apiKey) return res.status(500).json({ detail: 'Server is missing IVY_API_KEY.' });
  try {
    const response = await fetch(`${baseUrl}${target}`, options);
    const body = await response.text();
    res.status(response.status).type(response.headers.get('content-type') || 'application/json').send(body);
  } catch { res.status(502).json({ detail: 'Unable to reach Ivy Homes API.' }); }
}

app.post('/api/auth/login', (req, res) => forward(req, res, '/auth/login', {
  method: 'POST', headers: apiHeaders(req, { 'Content-Type': 'application/json' }), body: JSON.stringify(req.body)
}));
app.post('/api/auth/refresh', (req, res) => forward(req, res, '/auth/refresh', {
  method: 'POST', headers: apiHeaders(req, { 'Content-Type': 'application/json' }), body: JSON.stringify(req.body)
}));
app.post('/api/auth/logout', (req, res) => forward(req, res, '/auth/logout', { method: 'POST', headers: apiHeaders(req) }));
app.post('/api/uploads/signature', (req, res) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const cloudinaryKey = process.env.CLOUDINARY_API_KEY;
  const cloudinarySecret = process.env.CLOUDINARY_API_SECRET;
  if (!req.headers.authorization) return res.status(401).json({ detail: 'Sign in before uploading an image.' });
  if (!cloudName || !cloudinaryKey || !cloudinarySecret) return res.status(500).json({ detail: 'Server is missing Cloudinary configuration.' });

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'ivy-homes/listings';
  const signature = crypto.createHash('sha1').update(`folder=${folder}&timestamp=${timestamp}${cloudinarySecret}`).digest('hex');
  res.json({ cloud_name: cloudName, api_key: cloudinaryKey, timestamp, folder, signature });
});
app.all('/api/*', (req, res) => {
  const endpoint = req.params[0];
  const query = new URLSearchParams(req.query).toString();
  forward(req, res, `/v1/${endpoint}${query ? `?${query}` : ''}`, {
    method: req.method, headers: apiHeaders(req, req.body && ['POST', 'PUT', 'PATCH'].includes(req.method) ? { 'Content-Type': 'application/json' } : {}),
    body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? JSON.stringify(req.body) : undefined
  });
});

const root = path.resolve(serverDirectory, '../frontend/dist');
app.use(express.static(root));
app.get('*', (_, res) => res.sendFile(path.join(root, 'index.html')));
app.listen(process.env.PORT || 5174, () => console.log(`Ivy Homes server on ${process.env.PORT || 5174}`));
