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
const { renderTestimonials } = require('../lib/testimonials');

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

// ---------------------------------------------------------------------------
// testimonials.html — the review cards are generated from
// content/testimonials.json and written between two marker comments, so the
// page is still plain static HTML (readable by Google, no runtime fetch).
// Plain string replacement is used here (not cheerio) so nothing else in the
// file is touched and the step is safe to run repeatedly.
// ---------------------------------------------------------------------------
function renderTestimonialsPage() {
  const htmlPath = path.join(ROOT, 'testimonials.html');
  const jsonPath = path.join(ROOT, 'content', 'testimonials.json');
  if (!fs.existsSync(htmlPath) || !fs.existsSync(jsonPath)) {
    console.log('[inject-content] skip testimonials: missing testimonials.html or content/testimonials.json');
    return;
  }

  const START = '<!-- TESTIMONIALS:START -->';
  const END = '<!-- TESTIMONIALS:END -->';
  const html = fs.readFileSync(htmlPath, 'utf8');
  const a = html.indexOf(START);
  const b = html.indexOf(END);
  if (a === -1 || b === -1 || b < a) {
    console.warn('[inject-content] testimonials.html: marker comments not found — nothing rendered');
    return;
  }

  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const body = renderTestimonials(data);
  const next = html.slice(0, a + START.length) + '\n' + body + '\n    ' + html.slice(b);
  if (next !== html) fs.writeFileSync(htmlPath, next);
  const count = Array.isArray(data.reviews) ? data.reviews.length : 0;
  console.log(`[inject-content] testimonials.html: rendered ${count} review(s)`);
}

renderTestimonialsPage();
