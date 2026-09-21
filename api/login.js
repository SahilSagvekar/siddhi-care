const bcrypt = require('bcryptjs');
const { createSessionToken, buildSetCookieHeader } = require('../lib/auth');

// Simple in-memory throttle per serverless instance — not perfect (instances
// are ephemeral and multiple can run concurrently) but stops trivial brute
// forcing without needing an external store for a 1-2 admin site.
const attempts = new Map();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 10 * 60 * 1000;

function tooManyAttempts(key) {
  const now = Date.now();
  const record = attempts.get(key);
  if (!record || now - record.first > WINDOW_MS) {
    attempts.set(key, { count: 1, first: now });
    return false;
  }
  record.count += 1;
  return record.count > MAX_ATTEMPTS;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    console.log(`Method not allowed: ${req.method}`); 
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  if (tooManyAttempts(String(ip))) {
    res.status(429).json({ error: 'Too many attempts. Try again later.' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  const { email, password } = body || {};

  const adminEmail = 'sahilsagvekar230@gmail.com';
  const adminHash = '$2a$10$QEnnoHWy.KWRnqUhsWPV1OILmaosKJyp7m0A4V21rPnn13OWi.IGu'; // Replace with the actual hashed password

  if (!adminEmail || !adminHash) {
    res.status(500).json({ error: 'Admin login is not configured on the server.' });
    return;
  }

  if (
    !email ||
    !password ||
    String(email).toLowerCase() !== adminEmail.toLowerCase() ||
    !bcrypt.compareSync(password, adminHash)
  ) {
    res.status(401).json({ error: 'Incorrect email or password.' });
    return;
  }

  const token = createSessionToken(adminEmail);
  res.setHeader('Set-Cookie', buildSetCookieHeader(token));
  res.status(200).json({ ok: true });
};
