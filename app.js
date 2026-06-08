require('dotenv').config();

const express = require('express');
const path    = require('path');
const apiRoutes = require('./server/routes/apiRoutes');
const logger    = require('./server/utils/logger');

const app  = express();
const PORT = process.env.PORT || 3000;
// Determine the correct public directory path for both local and Netlify Functions
console.log('Current __dirname:', __dirname);
console.log('Current process.cwd():', process.cwd());
console.log('NETLIFY env var:', process.env.NETLIFY);
console.log('LAMBDA_TASK_ROOT env var:', process.env.LAMBDA_TASK_ROOT);

// Find project root by looking for package.json
let findProjectRoot = (dir) => {
  if (require('fs').existsSync(path.join(dir, 'package.json'))) {
    return dir;
  }
  const parentDir = path.dirname(dir);
  if (parentDir === dir) return dir; // Reached root
  return findProjectRoot(parentDir);
};

const projectRoot = findProjectRoot(__dirname);
const PUB = path.resolve(projectRoot, 'public');
console.log('Found project root:', projectRoot);
console.log('Final PUB path:', PUB);

const send = (file) => (req, res) => res.sendFile(path.join(PUB, file));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(PUB));

// Logging
app.use((req, res, next) => {
  logger.info(`[${req.method}] ${req.originalUrl}`);
  next();
});

// API routes
app.use('/api', apiRoutes);

// ── Page routes (clean URL) ──────────────────────────────────
app.get('/',             send('index.html'));
app.get('/recent',       send('recent.html'));
app.get('/search',       send('search.html'));
app.get('/ongoing',      send('ongoing.html'));
app.get('/completed',    send('completed.html'));
app.get('/popular',      send('popular.html'));
app.get('/movies',       send('movies.html'));
app.get('/schedule',     send('schedule.html'));
app.get('/genres',       send('genres.html'));
app.get('/genres/:slug', send('genre.html'));
app.get('/genre',        send('genre.html'));
app.get('/batch',        send('batch.html'));
app.get('/batch/:slug', send('batch-detail.html'));
app.get('/anime',        send('anime.html'));
app.get('/anime/:slug',  send('anime.html'));
app.get('/episode',      send('episode.html'));
app.get('/episode/:slug', send('episode.html'));
app.get('/daftar-anime', send('list.html'));
app.get('/list',         send('list.html'));

app.get('/login',    send('login.html'));
app.get('/register', send('register.html'));
app.get('/profile',  send('profile.html'));
app.get('/profile/history',   send('profile/history.html'));
app.get('/profile/favorites', send('profile/favorites.html'));
app.get('/profile/settings',  send('profile/settings.html'));
app.get('/profile/change-password', send('profile/change-password.html'));

// ── 404 ─────────────────────────────────────────────────────
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ status: false, message: `Endpoint '${req.originalUrl}' not found` });
  }
  res.status(404).sendFile(path.join(PUB, '404.html'));
});

// ── Error handler ────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`);
  res.status(500).json({ status: false, message: 'Internal server error', error: err.message });
});

// Lokal saja
if (process.env.NETLIFY !== 'true') {
  app.listen(PORT, () => logger.info(`Server running on http://localhost:${PORT}`));
}

module.exports = app;
