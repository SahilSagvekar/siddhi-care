const { buildSetCookieHeader } = require('../lib/auth');

module.exports = async (req, res) => {
  res.setHeader('Set-Cookie', buildSetCookieHeader('', { clear: true }));
  res.status(200).json({ ok: true });
};
