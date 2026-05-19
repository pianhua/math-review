require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb, startAutoSave } = require('./db');
const { startCron } = require('./cron');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/formulas', require('./routes/formulas'));
app.use('/api/problems', require('./routes/problems'));
app.use('/api/bookmarks', require('./routes/bookmarks'));
app.use('/api/attempts', require('./routes/attempts'));
app.use('/api/errors', require('./routes/errors'));
app.use('/api/mastery', require('./routes/mastery'));
app.use('/api/daily-review', require('./routes/dailyReview'));

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  await initDb();
  startAutoSave();
  startCron();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
