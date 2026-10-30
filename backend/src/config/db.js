const { Pool } = require('pg');
const env = require('./env');

/**
 * No usable DATABASE_URL? Fall back to the in-memory dev store (see
 * db/memory.js) so the whole API stays runnable locally.
 * Force it either way with DEMO_MODE=true|false in .env.
 */
function detectDemoMode() {
  if (process.env.DEMO_MODE === 'true') return true;
  if (process.env.DEMO_MODE === 'false') return false;
  const raw = env.DATABASE_URL || '';
  if (!raw || /\[PASSWORD\]|\[PROJECT-REF\]|your-/.test(raw)) return true;
  try {
    const parsed = new URL(raw);
    return !['postgres:', 'postgresql:'].includes(parsed.protocol);
  } catch (error) {
    return true;
  }
}

const DEMO_MODE = detectDemoMode();
const isDemoMode = () => DEMO_MODE;

if (DEMO_MODE) {
  console.warn('[db] DEMO MODE — data is stored in memory and resets on restart.');
  console.warn('[db] Set DATABASE_URL in backend/.env (Supabase) to use real PostgreSQL.\n');
} else if (!env.DATABASE_URL) {
  console.warn('[db] DATABASE_URL is not set. Copy backend/.env.example to backend/.env and add your Supabase connection string.');
}

// Supabase hosted Postgres always requires SSL; a local Postgres usually does not.
const useSsl = env.DB_SSL ? env.DB_SSL === 'true' : /supabase\.co|neon\.tech|rds\.amazonaws\.com/i.test(env.DATABASE_URL);

const pool = new Pool({
  connectionString: env.DATABASE_URL || undefined,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('[db] Unexpected idle client error:', err.message);
});

const query = (text, params) => pool.query(text, params);

/** Runs `fn(client)` inside a transaction, rolling back on any throw. */
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function ping() {
  await pool.query('select 1');
}

module.exports = { pool, query, withTransaction, ping, isDemoMode };
