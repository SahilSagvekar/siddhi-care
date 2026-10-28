// Commits a file update straight to the repo via the GitHub Contents API.
// Vercel's git integration picks up that commit and redeploys automatically —
// there is no database and no separate "publish" step beyond this commit.

function requireEnv(name) {
  const val = process.env[name];
  if (!val) throw new Error(`${name} is not set. Add it as a Vercel environment variable.`);
  return val;
}

async function githubRequest(path, options = {}) {
  const token = requireEnv('GITHUB_TOKEN');
  const res = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`GitHub API ${options.method || 'GET'} ${path} failed: ${res.status} ${body}`);
  }
  return res.json();
}

/**
 * Commit new JSON content to a file in the repo.
 * filePath is relative to the repo root, e.g. "content/services.json".
 */
async function commitJsonFile(filePath, jsonValue, commitMessage) {
  const owner = requireEnv('GITHUB_OWNER');
  const repo = requireEnv('GITHUB_REPO');
  const branch = process.env.GITHUB_BRANCH || 'main';

  const encodedPath = filePath.split('/').map(encodeURIComponent).join('/');

  // 1. Get the current file's SHA (required by the API to update an existing file).
  let sha;
  try {
    const current = await githubRequest(
      `/repos/${owner}/${repo}/contents/${encodedPath}?ref=${branch}`
    );
    sha = current.sha;
  } catch {
    sha = undefined; // file doesn't exist yet — will be created
  }

  const content = Buffer.from(JSON.stringify(jsonValue, null, 2) + '\n', 'utf8').toString(
    'base64'
  );

  // 2. Create or update the file — this is a real commit on the branch.
  return githubRequest(`/repos/${owner}/${repo}/contents/${encodedPath}`, {
    method: 'PUT',
    body: JSON.stringify({
      message: commitMessage || `Update ${filePath} via admin editor`,
      content,
      branch,
      ...(sha ? { sha } : {}),
    }),
  });
}

/**
 * Read a JSON file as it is on the branch right now (not the deployed copy,
 * which lags a minute behind after a save). Returns null if it doesn't exist.
 */
async function readJsonFile(filePath) {
  const owner = requireEnv('GITHUB_OWNER');
  const repo = requireEnv('GITHUB_REPO');
  const branch = process.env.GITHUB_BRANCH || 'main';
  const encodedPath = filePath.split('/').map(encodeURIComponent).join('/');
  try {
    const file = await githubRequest(`/repos/${owner}/${repo}/contents/${encodedPath}?ref=${branch}`);
    return JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'));
  } catch (err) {
    if (/ 404 /.test(err.message)) return null;
    throw err;
  }
}

module.exports = { commitJsonFile, readJsonFile };
