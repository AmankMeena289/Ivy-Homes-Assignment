import app from '../index.js';

export default function proxy(req, res) {
  const url = new URL(req.url, 'https://vercel.internal');
  const path = url.searchParams.get('__path');
  if (!path) return res.status(404).json({ detail: 'API route not found.' });

  url.searchParams.delete('__path');
  req.url = `/api/${path}${url.search}`;
  req.originalUrl = req.url;
  return app(req, res);
}
