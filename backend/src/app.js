const express = require('express');
const cors = require('cors');

const env = require('./config/env');
const passport = require('./config/passport');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { graphqlHandler } = require('./graphql/server');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const taskRoutes = require('./routes/task.routes');
const courseRoutes = require('./routes/course.routes');
const contactRoutes = require('./routes/contact.routes');

const app = express();

// Needed so express-rate-limit can read the real client IP behind a proxy
// (Render, Railway, Supabase-hosted deployments, etc.).
app.set('trust proxy', 1);

app.use(
  cors({
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',').map((o) => o.trim()),
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Profile photos uploaded through Multer
app.use('/uploads', express.static(env.UPLOAD_DIR, { maxAge: '7d' }));

app.get('/health', (req, res) => res.json({ success: true, service: 'campus-os-api', time: new Date().toISOString() }));

app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/contact', contactRoutes);

// GraphQL endpoint (same JWT as REST)
app.all('/graphql', ...graphqlHandler);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
