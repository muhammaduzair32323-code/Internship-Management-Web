const crypto = require('crypto');

// Signs the intern's id into the OAuth `state` param so the callback (which
// arrives as a plain browser redirect with no Authorization header) can
// trust which intern initiated the flow, without a server-side session store.
const SECRET = process.env.JWT_SECRET || 'dev-only-insecure-secret';

function sign(internId) {
  const hmac = crypto.createHmac('sha256', SECRET).update(String(internId)).digest('hex');
  return `${internId}.${hmac}`;
}

function verify(state) {
  if (!state || !state.includes('.')) return null;
  const [internId, hmac] = state.split('.');
  const expected = crypto.createHmac('sha256', SECRET).update(String(internId)).digest('hex');
  // Constant-time comparison to avoid timing side-channels on the HMAC check.
  const a = Buffer.from(hmac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return internId;
}

module.exports = { sign, verify };
