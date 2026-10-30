/**
 * Creates every table from schema.sql against the configured DATABASE_URL.
 *   npm run db:schema
 * (Equivalent to pasting schema.sql into the Supabase SQL Editor.)
 */
const fs = require('fs');
const path = require('path');

const { pool } = require('../config/db');

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  console.log('Applying schema.sql …');
  await pool.query(sql);
  console.log('✅  Tables created: users, courses, schedules, tasks');
  await pool.end();
}

main().catch((error) => {
  console.error('❌  Could not apply the schema:', error.message);
  process.exit(1);
});
