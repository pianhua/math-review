const express = require('express');
const { query, run, insert } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Submit an attempt
router.post('/', authMiddleware, (req, res) => {
  const { problem_id, selected_answer, is_correct, time_spent_seconds } = req.body;

  if (!problem_id || selected_answer === undefined || is_correct === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Insert attempt
  const attemptId = insert(
    'INSERT INTO attempts (user_id, problem_id, selected_answer, is_correct, time_spent_seconds) VALUES (?, ?, ?, ?, ?)',
    [req.userId, problem_id, selected_answer, is_correct ? 1 : 0, time_spent_seconds || 0]
  );

  // Update mastery stats
  const problem = query('SELECT chapter FROM problems WHERE id = ?', [problem_id]);
  if (problem.length > 0) {
    const chapter = problem[0].chapter;
    const existing = query(
      'SELECT id FROM mastery_stats WHERE user_id = ? AND chapter = ?',
      [req.userId, chapter]
    );

    if (existing.length === 0) {
      run(
        'INSERT INTO mastery_stats (user_id, chapter, total_solved, total_correct) VALUES (?, ?, 1, ?)',
        [req.userId, chapter, is_correct ? 1 : 0]
      );
    } else {
      run(
        'UPDATE mastery_stats SET total_solved = total_solved + 1, total_correct = total_correct + ?, last_updated = CURRENT_TIMESTAMP WHERE user_id = ? AND chapter = ?',
        [is_correct ? 1 : 0, req.userId, chapter]
      );
    }
  }

  // If wrong, add/update error record
  if (!is_correct) {
    const existingError = query(
      'SELECT id FROM errors WHERE user_id = ? AND problem_id = ?',
      [req.userId, problem_id]
    );

    if (existingError.length === 0) {
      run(
        'INSERT INTO errors (user_id, problem_id, wrong_answer, review_count, created_at) VALUES (?, ?, ?, 0, CURRENT_TIMESTAMP)',
        [req.userId, problem_id, selected_answer]
      );
    }
  }

  res.json({ success: true, attempt_id: attemptId });
});

// Get attempt history
router.get('/', authMiddleware, (req, res) => {
  const attempts = query(
    'SELECT a.*, p.chapter, p.content FROM attempts a JOIN problems p ON a.problem_id = p.id WHERE a.user_id = ? ORDER BY a.attempted_at DESC',
    [req.userId]
  );
  res.json({ attempts });
});

module.exports = router;
