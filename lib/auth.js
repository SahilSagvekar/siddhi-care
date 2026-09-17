// Minimal signed-session helper — no database, no JWT library.
// A session is: base64url(payload) + "." + HMAC-SHA256(payload, SESSION_SECRET)
// The cookie is httpOnly + Secure + SameSite=Strict so it never touches client JS
// and isn't sent on cross-site requests.

const crypto = require('crypto');

const COOKIE_NAME = 'siddhi_admin_session';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      'SESSION_SECRET is not set. Add it as a Vercel environment variable (a long random string).'
    );
  }
  return secret;
}

function base64url(input) {
  return Buffer.from(input).toString('base64url');
}

function sign(payloadStr) {
  return crypto.createHmac('sha256', getSecret()).update(payloadStr).digest('base64url');
}

/** Create a signed session cookie value for the given admin email. */
function createSessionToken(email) {
  const payload = JSON.stringify({ email, exp: Date.now() + SESSION_TTL_MS });
  const encoded = base64url(payload);
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

/** Verify a session cookie value. Returns the payload if valid, otherwise null. */
function verifySessionToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [encoded, signature] = token.split('.');
  const expected = sign(encoded);
  // constant-time compare
  const a = Buffer.from(signature || '');
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader) {
  const out = {};
  if (!cookieHeader) return out;
  cookieHeader.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    out[key] = decodeURIComponent(val);
  });
  return out;
}

/** Reads and verifies the session cookie from a Vercel/Node request object. */
function getSession(req) {
  const cookies = parseCookies(req.headers.cookie);
  return verifySessionToken(cookies[COOKIE_NAME]);
}

function buildSetCookieHeader(token, { clear = false } = {}) {
  const maxAge = clear ? 0 : Math.floor(SESSION_TTL_MS / 1000);
  const value = clear ? '' : token;
  return [
    `${COOKIE_NAME}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
    `Max-Age=${maxAge}`,
  ].join('; ');
}

module.exports = {
  COOKIE_NAME,
  createSessionToken,
  verifySessionToken,
  getSession,
  buildSetCookieHeader,
};
