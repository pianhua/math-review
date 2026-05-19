const express = require('express');
const { query, run } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get user's error book
router.get('/', authMiddleware, (req, res) => {
  const errors = query(
    `SELECT e.*, p.chapter, p.source, p.content, p.correct, p.explanation
     FROM errors e
     JOIN problems p ON e.problem_id = p.id
     WHERE e.user_id = ?
     ORDER BY e.created_at DESC`,
    [req.userId]
  );

  res.json({ errors });
});

// Review an error (increment review count)
router.post('/:id/review', authMiddleware, (req, res) => {
  const { id } = req.params;

  const error = query('SELECT * FROM errors WHERE id = ? AND user_id = ?', [id, req.userId]);
  if (error.length === 0) {
    return res.status(404).json({ error: 'Error record not found' });
  }

  run(
    'UPDATE errors SET review_count = review_count + 1, last_review_date = CURRENT_TIMESTAMP WHERE id = ?',
    [id]
  );

  res.json({ success: true });
});

module.exports = router;
