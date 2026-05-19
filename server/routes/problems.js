const express = require('express');
const { query } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function attachBookmarks(problems, userId) {
  const bookmarks = query(
    'SELECT item_id FROM bookmarks WHERE user_id = ? AND item_type = ?',
    [userId, 'problem']
  );
  const bookmarkSet = new Set(bookmarks.map(b => b.item_id));

  return problems.map(p => ({
    ...p,
    options: JSON.parse(p.options),
    bookmarked: bookmarkSet.has(p.id)
  }));
}

// Unified problem fetch endpoint with mode support
// Modes: all (default), daily, chapter, bookmark, wrong
router.get('/', authMiddleware, (req, res) => {
  const mode = req.query.mode || 'all';
  let problems = [];

  switch (mode) {
    case 'daily': {
      const today = getToday();
      const review = query(
        'SELECT problems FROM daily_reviews WHERE review_date = ?',
        [today]
      );
      if (review.length > 0) {
        const problemIds = JSON.parse(review[0].problems);
        for (const pid of problemIds) {
          const p = query('SELECT * FROM problems WHERE id = ?', [pid]);
          if (p.length > 0) problems.push(p[0]);
        }
      }
      break;
    }

    case 'chapter': {
      const chapter = req.query.chapter;
      if (chapter) {
        problems = query('SELECT * FROM problems WHERE chapter = ? ORDER BY id', [chapter]);
      }
      break;
    }

    case 'bookmark': {
      const bookmarks = query(
        'SELECT item_id FROM bookmarks WHERE user_id = ? AND item_type = ?',
        [req.userId, 'problem']
      );
      for (const b of bookmarks) {
        const p = query('SELECT * FROM problems WHERE id = ?', [b.item_id]);
        if (p.length > 0) problems.push(p[0]);
      }
      break;
    }

    case 'wrong': {
      const errors = query(
        'SELECT problem_id FROM errors WHERE user_id = ?',
        [req.userId]
      );
      for (const e of errors) {
        const p = query('SELECT * FROM problems WHERE id = ?', [e.problem_id]);
        if (p.length > 0) problems.push(p[0]);
      }
      break;
    }

    case 'all':
    default: {
      problems = query('SELECT * FROM problems ORDER BY chapter, id');
      break;
    }
  }

  res.json({ problems: attachBookmarks(problems, req.userId) });
});

module.exports = router;
