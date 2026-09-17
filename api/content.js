const fs = require('fs');
const path = require('path');
const { getSession } = require('../lib/auth');
const { commitJsonFile } = require('../lib/github');

// Whitelist of editable pages — prevents path traversal and keeps the admin
// UI's page picker in sync with what's actually wired up to data-k attributes.
// Add an entry here (and a matching content/<page>.json + data-k attributes
// in the HTML) whenever you extend editing to another page.
const ALLOWED_PAGES = ['index', 'services', 'plans', 'team', 'contact'];

function contentPath(page) {
  return path.join(process.cwd(), 'content', `${page}.json`);
}

module.exports = async (req, res) => {
  const session = getSession(req);
  if (!session) {
    res.status(401).json({ error: 'Not signed in.' });
    return;
  }

  if (req.method === 'GET') {
    const page = String(req.query.page || '');
    if (!ALLOWED_PAGES.includes(page)) {
      res.status(400).json({ error: 'Unknown page.' });
      return;
    }
    const filePath = contentPath(page);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: `content/${page}.json does not exist yet.` });
      return;
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    res.status(200).json({ page, data });
    return;
  }

  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }
    const { page, data } = body || {};

    if (!ALLOWED_PAGES.includes(page)) {
      res.status(400).json({ error: 'Unknown page.' });
      return;
    }
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      res.status(400).json({ error: 'Content must be a JSON object.' });
      return;
    }

    try {
      await commitJsonFile(
        `content/${page}.json`,
        data,
        `Update ${page} content via admin editor (${session.email})`
      );
    } catch (err) {
      res.status(502).json({ error: `Could not save to GitHub: ${err.message}` });
      return;
    }

    res.status(200).json({
      ok: true,
      message: 'Saved. The site will redeploy automatically — changes usually go live within a minute.',
    });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
