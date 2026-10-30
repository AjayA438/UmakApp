const app = require('./app');
const env = require('./config/env');
const { ping, isDemoMode } = require('./config/db');
const memory = require('./db/memory');

const server = app.listen(env.PORT, () => {
  console.log(`\n🎓  Campus OS API running on http://localhost:${env.PORT}`);
  console.log(`    REST      → http://localhost:${env.PORT}/api`);
  console.log(`    GraphQL   → http://localhost:${env.PORT}/graphql`);
  console.log(`    Health    → http://localhost:${env.PORT}/health\n`);
});

if (isDemoMode()) {
  // In-memory store: seed a ready-to-use demo student so the app is
  // clickable immediately. Data resets when the server restarts.
  memory.seedDemoData();
  console.log('🧪  Demo mode: sign in with  demo@campus.os  /  Campus123');
  console.log('     (or create a fresh account — everything is in memory)\n');
} else {
  // Fail fast (and loudly) if the database is unreachable.
  ping()
    .then(() => console.log('✅  Connected to PostgreSQL (Supabase)'))
    .catch((error) => {
      console.error('⚠️   Could not reach the database:', error.message);
      console.error('     Check DATABASE_URL in backend/.env — see backend/src/db/schema.sql to create the tables.\n');
    });
}

if (!env.isMailConfigured) {
  console.log('📧  Mailer in DEV mode: emails are printed to this console (set SMTP_* in .env to deliver them).');
}

process.on('unhandledRejection', (reason) => {
  console.error('[api] Unhandled rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[api] Uncaught exception:', error);
  server.close(() => process.exit(1));
});
