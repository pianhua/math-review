const express = require('express');
const { query, run } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get user's bookmarks
router.get('/', authMiddleware, (req, res) => {
  const bookmarks = query(
    'SELECT * FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC',
    [req.userId]
  );
  res.json({ bookmarks });
});

// Add bookmark
router.post('/', authMiddleware, (req, res) => {
  const { item_id, item_type } = req.body;

  if (!item_id || !['formula', 'problem'].includes(item_type)) {
    return res.status(400).json({ error: 'Invalid item_id or item_type' });
  }

  try {
    run(
      'INSERT OR IGNORE INTO bookmarks (user_id, item_id, item_type) VALUES (?, ?, ?)',
      [req.userId, item_id, item_type]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add bookmark' });
  }
});

// Remove bookmark
router.delete('/:item_id', authMiddleware, (req, res) => {
  const { item_id } = req.params;
  const { item_type } = req.query;

  run(
    'DELETE FROM bookmarks WHERE user_id = ? AND item_id = ? AND item_type = ?',
    [req.userId, item_id, item_type]
  );
  res.json({ success: true });
});

module.exports = router;
