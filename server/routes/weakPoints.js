const express = require('express');
const { query, run } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get user's weak chapters and weak problems
router.get('/', authMiddleware, (req, res) => {
  const userId = req.userId;

  // 1. Get chapters with weak/unfamiliar count >= 3
  const weakChapters = query(
    `SELECT p.chapter, COUNT(*) as weak_count
     FROM user_problem_progress upp
     JOIN problems p ON p.id = upp.problem_id
     WHERE upp.user_id = ? AND upp.mastery IN ('weak', 'unfamiliar')
     GROUP BY p.chapter
     HAVING weak_count >= 3
     ORDER BY weak_count DESC`,
    [userId]
  );

  // 2. Also consider chapters with < 70% accuracy from attempts
  const accuracyChapters = query(
    `SELECT p.chapter,
      COUNT(*) as total,
      SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) as correct
     FROM attempts a
     JOIN problems p ON p.id = a.problem_id
     WHERE a.user_id = ? AND a.attempted_at >= date('now', '-7 days')
     GROUP BY p.chapter
     HAVING total > 0 AND (correct * 100 / total) < 70`,
    [userId]
  );

  // Merge: accuracy-based chapters not already in weakChapters
  const weakChapterNames = new Set(weakChapters.map(c => c.chapter));
  for (const c of accuracyChapters) {
    if (!weakChapterNames.has(c.chapter)) {
      weakChapters.push({
        chapter: c.chapter,
        weak_count: parseInt(c.total) - parseInt(c.correct)
      });
    }
  }

  // 3. Get weak problems grouped by chapter
  const problemsByChapter = {};
  for (const chapter of weakChapters) {
    const probs = query(
      `SELECT p.*, upp.mastery
       FROM user_problem_progress upp
       JOIN problems p ON p.id = upp.problem_id
       WHERE upp.user_id = ? AND p.chapter = ? AND upp.mastery IN ('weak', 'unfamiliar')
       ORDER BY upp.updated_at DESC
       LIMIT 20`,
      [userId, chapter.chapter]
    );
    problemsByChapter[chapter.chapter] = probs.map(p => ({
      ...p,
      options: JSON.parse(p.options)
    }));
  }

  res.json({
    weak_chapters: weakChapters,
    problems_by_chapter: problemsByChapter
  });
});

// Update mastery level for a problem
router.post('/mastery', authMiddleware, (req, res) => {
  const { problem_id, mastery } = req.body;
  const userId = req.userId;

  if (!problem_id || !['weak', 'unfamiliar', 'mastered'].includes(mastery)) {
    return res.status(400).json({ error: 'Invalid problem_id or mastery' });
  }

  const existing = query(
    'SELECT id FROM user_problem_progress WHERE user_id = ? AND problem_id = ?',
    [userId, problem_id]
  );

  if (existing.length > 0) {
    run(
      'UPDATE user_problem_progress SET mastery = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND problem_id = ?',
      [mastery, userId, problem_id]
    );
  } else {
    run(
      'INSERT INTO user_problem_progress (user_id, problem_id, mastery) VALUES (?, ?, ?)',
      [userId, problem_id, mastery]
    );
  }

  res.json({ success: true });
});

module.exports = router;
