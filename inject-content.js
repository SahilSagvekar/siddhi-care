// Runs as the Vercel build command. For each page listed below, it loads
// content/<page>.json and writes each value into the element in <page>.html
// whose data-k attribute matches that value's path (e.g. data-k="hero.headline").
//
// The .html files are the permanent source of truth for structure and markup;
// content/*.json is the source of truth for the *text* inside data-k elements.
// This script makes the deployed HTML match the JSON on every build — nothing
// else about the page is touched.

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const ROOT = path.join(__dirname, '..');
const PAGES = ['index', 'services', 'plans', 'team', 'contact'];

function getByPath(obj, keyPath) {
  return keyPath.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function injectPage(page) {
  const htmlPath = path.join(ROOT, `${page}.html`);
  const jsonPath = path.join(ROOT, 'content', `${page}.json`);

  if (!fs.existsSync(htmlPath)) {
    console.log(`[inject-content] skip ${page}: no ${page}.html`);
    return;
  }
  if (!fs.existsSync(jsonPath)) {
    console.log(`[inject-content] skip ${page}: no content/${page}.json`);
    return;
  }

  const html = fs.readFileSync(htmlPath, 'utf8');
  const content = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const $ = cheerio.load(html, { decodeEntities: false });

  let applied = 0;
  let missing = 0;

  $('[data-k]').each((_, el) => {
    const key = $(el).attr('data-k');
    const value = getByPath(content, key);
    if (value === undefined) {
      missing += 1;
      console.warn(`[inject-content] ${page}.html: no content for data-k="${key}"`);
      return;
    }
    // Every data-k element is expected to hold plain text only (see README-ADMIN.md).
    // Icons/links live as sibling elements outside the data-k span, so a plain
    // text replace here never disturbs surrounding markup.
    $(el).text(String(value));
    applied += 1;
  });

  fs.writeFileSync(htmlPath, $.html());
  console.log(`[inject-content] ${page}.html: applied ${applied}, missing ${missing}`);
}

for (const page of PAGES) {
  injectPage(page);
}
