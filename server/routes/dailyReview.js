const express = require('express');
const { query, run } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { generateGlobalDailyReview } = require('../cron');

const router = express.Router();

function getToday() {
  return new Date().toISOString().split('T')[0];
}

// Get today's global review + user's progress
router.get('/', authMiddleware, async (req, res) => {
  const today = getToday();

  const review = query(
    'SELECT * FROM daily_reviews WHERE review_date = ?',
    [today]
  );

  if (review.length === 0) {
    return res.json({ review: null });
  }

  const problemIds = JSON.parse(review[0].problems);
  const problems = [];

  for (const pid of problemIds) {
    const p = query('SELECT * FROM problems WHERE id = ?', [pid]);
    if (p.length > 0) {
      problems.push({
        ...p[0],
        options: JSON.parse(p[0].options)
      });
    }
  }

  // Check which problems this user has completed correctly today
  const completed = query(
    `SELECT DISTINCT problem_id FROM attempts
     WHERE user_id = ? AND problem_id IN (${problemIds.map(() => '?').join(',')})
     AND is_correct = 1 AND date(attempted_at) = ?`,
    [req.userId, ...problemIds, today]
  );
  const completedIds = new Set(completed.map(c => c.problem_id));

  // Attach bookmark status
  const bookmarks = query(
    'SELECT item_id FROM bookmarks WHERE user_id = ? AND item_type = ?',
    [req.userId, 'problem']
  );
  const bookmarkSet = new Set(bookmarks.map(b => b.item_id));

  res.json({
    review: {
      ...review[0],
      problems: problems.map(p => ({
        ...p,
        completed: completedIds.has(p.id),
        bookmarked: bookmarkSet.has(p.id)
      })),
      completed_count: completedIds.size,
      total_count: problems.length
    }
  });
});

// Manual trigger (admin fallback)
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    await generateGlobalDailyReview();
    const today = getToday();
    const review = query('SELECT * FROM daily_reviews WHERE review_date = ?', [today]);

    if (review.length === 0) {
      return res.status(500).json({ error: 'Generation failed' });
    }

    const problemIds = JSON.parse(review[0].problems);
    const problems = [];
    for (const pid of problemIds) {
      const p = query('SELECT * FROM problems WHERE id = ?', [pid]);
      if (p.length > 0) {
        problems.push({ ...p[0], options: JSON.parse(p[0].options) });
      }
    }

    res.json({
      review: {
        ...review[0],
        problems,
        completed_count: 0,
        total_count: problems.length
      }
    });
  } catch (err) {
    console.error('Generate daily review error:', err);
    res.status(500).json({ error: 'Failed to generate daily review' });
  }
});

module.exports = router;
