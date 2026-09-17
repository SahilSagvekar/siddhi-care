// Run this locally to generate the value for ADMIN_PASSWORD_HASH.
// Usage:  node scripts/hash-password.js "your-chosen-password"
// Then paste the printed hash into Vercel's environment variables —
// never commit the plaintext password or paste it anywhere else.

const bcrypt = require('bcryptjs');

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/hash-password.js "your-chosen-password"');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log('\nADMIN_PASSWORD_HASH=' + hash + '\n');
console.log('Paste this whole line\'s value into the ADMIN_PASSWORD_HASH environment');
console.log('variable in your Vercel project settings. Do not commit the plaintext password.');