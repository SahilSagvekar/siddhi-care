# Admin content editor

Lets an admin log in at `/admin` and edit the site's text. No database, no
runtime cost on visitor page loads — the site stays exactly as fast as it is
today.

## How it works

```
Admin edits a field in /admin
        │
        ▼
POST /api/content  (checks the session cookie)
        │
        ▼
Commits content/<page>.json straight to this GitHub repo
        │
        ▼
Vercel's git integration sees the new commit → runs `npm run build`
        │
        ▼
scripts/inject-content.js reads content/<page>.json and writes each value
into the element in <page>.html whose data-k="..." attribute matches
        │
        ▼
Vercel deploys the updated, still 100% static, HTML
```

Visitors never hit a database or an API — they get plain static HTML/CSS/JS
exactly like now. The only cost is one GitHub API call when an admin saves,
and one ~15–20 second Vercel build after that. Both are far inside Vercel's
free Hobby tier even with dozens of edits a day.

This is also why an earlier idea — storing all page text in Vercel Edge
Config — doesn't fit here: Edge Config's free tier caps a store at 8KB, and
this site's actual on-page text already runs to about 20KB. The git+rebuild
approach has no such ceiling.

## One-time setup

1. **Install dependencies** (already in `package.json`): `npm install`.

2. **Create a GitHub token** the site can use to commit content changes:
   Settings → Developer settings → Fine-grained tokens → generate one scoped
   to just this repo, with **Contents: Read and write** permission.

3. **Generate a session secret**:
   ```
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. **Add environment variables in Vercel** (Project Settings → Environment
   Variables) — see `.env` for reference:
   - `ADMIN_EMAIL` (your admin email)
   - `ADMIN_PASSWORD` (your plain admin password)
   - `SESSION_SECRET` (from step 3)
   - `GITHUB_TOKEN` (from step 2)
   - `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BRANCH`

6. **Deploy.** Vercel will run `npm run build` automatically, which runs
   `scripts/inject-content.js` before serving the site.

7. Visit `/admin`, sign in, and edit.

## What's editable right now

Two pages are fully wired end-to-end as a working reference:

- **`services.html`** — hero, trust badges, the "What We Offer" heading, all
  7 service cards (title + description + "Learn More" label), the section
  CTA button, the checklist/photo section, both coordinators' name and role,
  the final CTA block, and the footer tagline.
- **`index.html`** — hero (badge, heading, lede, button label), the "Our
  Mission" section, and the 4 trust-strip stats.

`plans.html`, `team.html`, and `contact.html` aren't wired yet — the admin
page picker will show them, but there's no `content/<page>.json` for them so
nothing will load. Extending coverage is mechanical (see below), not a new
architecture.

**Deliberately left out of scope, everywhere:**
- Nav labels and footer link labels (structural, low value to edit)
- Any text that also appears in a `tel:`/`href` (e.g. "Call 8369 180 832") —
  editing just the display text would desync it from the actual phone number
  it links to. Phone numbers still need a direct HTML edit.
- Image `alt` text, the footer copyright line (already dynamic via JS), and
  page `<title>`/meta description tags.
- Rich text / HTML formatting — every field is plain text on purpose, so
  there's no XSS surface and no way to accidentally break the layout with
  stray markup.

## Extending to another page or another piece of text

1. In the `.html` file, find the element holding the text you want editable.
   - If it's a plain element with **only** text inside (a `<p>`, `<h3>`,
     etc.) — add `data-k="somePage.someKey"` directly to that tag.
   - If the element also contains other elements (an icon `<svg>`, an
     `<em>`, a `<br>`) — **never** put `data-k` on that outer element,
     because the build script replaces an element's entire contents with
     plain text. Instead wrap just the text run in its own
     `<span data-k="...">text</span>` (or `<strong>`/`<em>` as appropriate),
     right alongside the untouched icon/markup. Every existing `data-k` in
     `services.html`/`index.html` follows this rule — copy the pattern.
   - For a repeated block (cards, list items), key each instance by index:
     `services.0.title`, `services.1.title`, etc.

2. Add the matching key/value to `content/<page>.json` (create the file if
   the page doesn't have one yet — copy the shape from `content/services.json`
   for reference). The key path in the JSON must exactly match the `data-k`
   dot-path.

3. If it's a brand-new page, add its name to `ALLOWED_PAGES` in
   `api/content.js` and to the `PAGES` array in `scripts/inject-content.js`.

4. Run `npm run build` locally to confirm the injection applies cleanly
   (`node scripts/inject-content.js`), then commit.

The admin form itself needs **no changes** for any of this — it renders
inputs generically from whatever shape `content/<page>.json` has.

## Known cosmetic side effect

The build script parses and re-serializes each HTML file, which normalizes
some things that don't affect rendering at all: self-closing SVG tags
(`<path .../>`) become explicit closing tags (`<path ...></path>`), boolean
attributes like `required` become `required=""`, and `&` in URLs gets
escaped to `&amp;`. All standard, valid HTML5 — browsers render both forms
identically. You'll see this in the diff on the very first build; it's not
a bug.

## Security notes

- The session cookie is `HttpOnly`, `Secure`, and `SameSite=Strict` — it's
  never readable from JavaScript and never sent on cross-site requests.
- Login is rate-limited per serverless instance (8 attempts / 10 minutes).
  This isn't perfect (Vercel can spin up multiple instances), but it stops
  trivial brute-forcing for what's meant to be a 1–2 admin site. If you want
  stronger protection later, move the counter into Vercel KV or Upstash
  Redis.
- There's currently one shared admin login. If you want per-person accounts
  or an audit trail of who changed what, that's a bigger step (real user
  table) — worth doing only if more than one or two people will ever use
  this.
