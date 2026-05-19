const express = require('express');
const { query } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all formulas with user's bookmark status
router.get('/', authMiddleware, (req, res) => {
  const formulas = query('SELECT * FROM formulas ORDER BY chapter, id');
  const bookmarks = query(
    'SELECT item_id FROM bookmarks WHERE user_id = ? AND item_type = ?',
    [req.userId, 'formula']
  );
  const bookmarkSet = new Set(bookmarks.map(b => b.item_id));

  const result = formulas.map(f => ({
    ...f,
    bookmarked: bookmarkSet.has(f.id)
  }));

  res.json({ formulas: result });
});

module.exports = router;
