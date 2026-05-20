const express = require('express');
const { query, run } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { generateDailyReview } = require('../services/ai');

const router = express.Router();
const REVIEW_COUNT = 5;

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function analyzeUserWeakChapters(userId) {
  // 1. From user_problem_progress
  const progressWeak = query(
    `SELECT p.chapter, COUNT(*) as weak_count
     FROM user_problem_progress upp
     JOIN problems p ON p.id = upp.problem_id
     WHERE upp.user_id = ? AND upp.mastery IN ('weak', 'unfamiliar')
     GROUP BY p.chapter
     HAVING weak_count >= 3
     ORDER BY weak_count DESC`,
    [userId]
  );

  // 2. From attempts accuracy
  const accuracyWeak = query(
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

  const weakSet = new Set(progressWeak.map(c => c.chapter));
  const result = progressWeak.map(c => ({
    chapter: c.chapter,
    accuracy: 0,
    total: parseInt(c.weak_count)
  }));

  for (const c of accuracyWeak) {
    if (!weakSet.has(c.chapter)) {
      result.push({
        chapter: c.chapter,
        accuracy: Math.round((parseInt(c.correct) / parseInt(c.total)) * 100),
        total: parseInt(c.total)
      });
    }
  }

  if (result.length === 0) {
    // Fallback: random chapters
    const all = query('SELECT DISTINCT chapter FROM problems ORDER BY RANDOM() LIMIT 3');
    return all.map(c => ({ chapter: c.chapter, accuracy: 50, total: 0 }));
  }

  return result.slice(0, 3);
}

function getUserQuota(userId) {
  const today = getToday();
  const quota = query(
    'SELECT * FROM ai_generation_quota WHERE user_id = ?',
    [userId]
  );

  if (quota.length === 0) {
    run(
      'INSERT INTO ai_generation_quota (user_id, used_today, quota_date) VALUES (?, 0, ?)',
      [userId, today]
    );
    return { remaining: 5, used: 0 };
  }

  const q = quota[0];
  if (q.quota_date !== today) {
    run(
      'UPDATE ai_generation_quota SET used_today = 0, quota_date = ? WHERE user_id = ?',
      [today, userId]
    );
    return { remaining: 5, used: 0 };
  }

  const used = parseInt(q.used_today) || 0;
  return { remaining: Math.max(0, 5 - used), used };
}

function incrementQuota(userId) {
  const today = getToday();
  run(
    'UPDATE ai_generation_quota SET used_today = used_today + 1, quota_date = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
    [today, userId]
  );
}

// Get user's daily review
router.get('/', authMiddleware, async (req, res) => {
  const today = getToday();
  const userId = req.userId;

  const review = query(
    'SELECT * FROM daily_reviews WHERE user_id = ? AND review_date = ?',
    [userId, today]
  );

  if (review.length === 0) {
    return res.json({ review: null, quota: getUserQuota(userId) });
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

  const completed = query(
    `SELECT DISTINCT problem_id FROM attempts
     WHERE user_id = ? AND problem_id IN (${problemIds.map(() => '?').join(',')})
     AND is_correct = 1 AND date(attempted_at) = ?`,
    [userId, ...problemIds, today]
  );
  const completedIds = new Set(completed.map(c => c.problem_id));

  const bookmarks = query(
    'SELECT item_id FROM bookmarks WHERE user_id = ? AND item_type = ?',
    [userId, 'problem']
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
    },
    quota: getUserQuota(userId)
  });
});

// Generate daily review for user
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const today = getToday();

    // Check quota
    const quota = getUserQuota(userId);
    if (quota.remaining <= 0) {
      return res.status(429).json({ error: '今日 AI 生成次数已用完（5/5），请明天再试' });
    }

    // Check if already exists
    const existing = query(
      'SELECT * FROM daily_reviews WHERE user_id = ? AND review_date = ?',
      [userId, today]
    );
    if (existing.length > 0) {
      // Delete old and regenerate
      run('DELETE FROM daily_reviews WHERE user_id = ? AND review_date = ?', [userId, today]);
    }

    // Analyze weak chapters
    const weakChapters = analyzeUserWeakChapters(userId);

    let problems = [];
    let usedAi = false;

    // Try AI generation
    try {
      const generated = await generateDailyReview(weakChapters, REVIEW_COUNT);
      if (generated.problems && generated.problems.length > 0) {
        for (const prob of generated.problems) {
          const id = `ai-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
          run(
            `INSERT INTO problems (id, chapter, source, difficulty, type, content, options, correct, explanation, knowledge_point, is_ai_generated, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))`,
            [
              id,
              prob.chapter || weakChapters[0].chapter,
              'AI生成',
              prob.difficulty || 'basic',
              prob.type || '选择题',
              prob.content,
              JSON.stringify(prob.options || []),
              prob.correct,
              prob.explanation,
              prob.knowledge_point || ''
            ]
          );
          problems.push(id);
        }
        usedAi = true;
      }
    } catch (err) {
      console.log('AI generation failed, using fallback:', err.message);
    }

    // Fallback: pick from problem pool based on weak chapters
    if (problems.length === 0) {
      const weakChapterNames = weakChapters.map(c => c.chapter);
      const poolSize = Math.min(weakChapterNames.length * 3, REVIEW_COUNT * 2);

      let fallback = query(
        `SELECT * FROM problems WHERE chapter IN (${weakChapterNames.map(() => '?').join(',')}) ORDER BY RANDOM() LIMIT ?`,
        [...weakChapterNames, poolSize]
      );

      if (fallback.length === 0) {
        fallback = query('SELECT * FROM problems ORDER BY RANDOM() LIMIT ?', [REVIEW_COUNT]);
      }

      while (fallback.length < REVIEW_COUNT) {
        const extra = query('SELECT * FROM problems WHERE id NOT IN (' +
          fallback.map(() => '?').join(',') + ') ORDER BY RANDOM() LIMIT ?',
          [...fallback.map(p => p.id), REVIEW_COUNT - fallback.length]);
        fallback.push(...extra);
        if (extra.length === 0) break;
      }

      problems = fallback.slice(0, REVIEW_COUNT).map(p => p.id);
    }

    // Save to user's daily_reviews
    run(
      `INSERT INTO daily_reviews (user_id, review_date, problems, weak_chapters, generated_at)
       VALUES (?, ?, ?, ?, datetime('now'))`,
      [userId, today, JSON.stringify(problems), JSON.stringify(weakChapters.map(c => c.chapter))]
    );

    // Increment quota if AI was used
    if (usedAi) {
      incrementQuota(userId);
    }

    // Return the generated review
    const review = query(
      'SELECT * FROM daily_reviews WHERE user_id = ? AND review_date = ?',
      [userId, today]
    );

    const problemIds = JSON.parse(review[0].problems);
    const problemList = [];
    for (const pid of problemIds) {
      const p = query('SELECT * FROM problems WHERE id = ?', [pid]);
      if (p.length > 0) {
        problemList.push({ ...p[0], options: JSON.parse(p[0].options) });
      }
    }

    res.json({
      review: {
        ...review[0],
        problems: problemList,
        completed_count: 0,
        total_count: problemList.length
      },
      quota: getUserQuota(userId)
    });
  } catch (err) {
    console.error('Generate daily review error:', err);
    res.status(500).json({ error: 'Failed to generate daily review' });
  }
});

module.exports = router;
