const express = require('express');
const { query } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get mastery statistics
router.get('/', authMiddleware, (req, res) => {
  const stats = query(
    'SELECT chapter, total_solved, total_correct FROM mastery_stats WHERE user_id = ?',
    [req.userId]
  );

  const totalSolved = stats.reduce((sum, s) => sum + s.total_solved, 0);
  const totalCorrect = stats.reduce((sum, s) => sum + s.total_correct, 0);
  const accuracy = totalSolved > 0 ? Math.round((totalCorrect / totalSolved) * 100) : 0;

  // Get streak (consecutive days with attempts)
  const attempts = query(
    'SELECT DISTINCT date(attempted_at) as date FROM attempts WHERE user_id = ? ORDER BY date DESC',
    [req.userId]
  );

  let streakDays = 0;
  if (attempts.length > 0) {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const mostRecent = attempts[0].date;

    if (mostRecent === today || mostRecent === yesterday) {
      streakDays = 1;
      for (let i = 1; i < attempts.length; i++) {
        const prevDate = new Date(attempts[i - 1].date);
        const currDate = new Date(attempts[i].date);
        const diffDays = (prevDate - currDate) / (1000 * 60 * 60 * 24);
        if (diffDays === 1) {
          streakDays++;
        } else {
          break;
        }
      }
    }
  }

  // Get total study time (estimate: 3 min per attempt)
  const totalStudyMinutes = totalSolved * 3;

  const chapters = stats.map(s => ({
    name: s.chapter,
    solved: s.total_solved,
    correct: s.total_correct,
    totalProblems: 50 // placeholder for now
  }));

  res.json({
    mastery: {
      totalSolved,
      totalCorrect,
      accuracy,
      streakDays,
      totalStudyMinutes,
      chapters
    }
  });
});

module.exports = router;
