const crypto = require('crypto');

const DEFAULTS = {
  ca: 'COMING_SOON',
  twitter: '#',
  buy: '#'
};

async function redisGet(key) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(['GET', key])
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.result || null;
}

async function redisSet(key, value) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('Redis not configured');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(['SET', key, value])
  });

  if (!res.ok) throw new Error('Redis SET failed');
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const CONFIG_KEY = 'obsessed:config';

  if (req.method === 'GET') {
    try {
      const raw = await redisGet(CONFIG_KEY);
      if (raw) return res.status(200).json(JSON.parse(raw));
      return res.status(200).json(DEFAULTS);
    } catch {
      return res.status(200).json(DEFAULTS);
    }
  }

  if (req.method === 'POST') {
    const adminHash = (process.env.ADMIN_HASH || '').trim();
    if (!adminHash) {
      return res.status(500).json({ error: 'Admin not configured.' });
    }

    const authHeader = req.headers.authorization || '';
    const password = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!password || hashPassword(password) !== adminHash) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const body = req.body;
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Invalid body.' });
    }

    try {
      let existing = DEFAULTS;
      const raw = await redisGet(CONFIG_KEY);
      if (raw) existing = { ...DEFAULTS, ...JSON.parse(raw) };

      const updated = {
        ca: body.ca || existing.ca,
        twitter: body.twitter || existing.twitter,
        buy: body.buy || existing.buy
      };

      await redisSet(CONFIG_KEY, JSON.stringify(updated));
      return res.status(200).json({ success: true, config: updated });
    } catch {
      return res.status(500).json({ error: 'Failed to save config.' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed.' });
};
